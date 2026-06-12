<?php

declare(strict_types=1);

namespace App\Integration\Assistant\Service;

use App\Application\Assembler\WorkoutSessionAssembler;
use App\Application\Factory\AddWorkoutEntryInputFactory;
use App\Application\Service\WorkoutEntryCreator;
use App\Application\Validation\AddWorkoutEntryInputValidator;
use App\Entity\Exercise;
use App\Entity\WorkoutSession;
use App\Integration\Assistant\Exception\AssistantToolException;
use App\Repository\ExerciseRepository;
use App\Repository\WorkoutSessionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Response;

final class AssistantWorkoutToolService
{
    private const MOODS = ['mala', 'normal', 'buena', 'muy_buena'];

    public function __construct(
        private readonly WorkoutSessionRepository $workoutSessionRepository,
        private readonly ExerciseRepository $exerciseRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly WorkoutSessionAssembler $workoutSessionAssembler,
        private readonly AddWorkoutEntryInputFactory $addWorkoutEntryInputFactory,
        private readonly AddWorkoutEntryInputValidator $addWorkoutEntryInputValidator,
        private readonly WorkoutEntryCreator $workoutEntryCreator,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function listRecentSessions(array $payload): array
    {
        $limit = $this->optionalPositiveInt($payload['limit'] ?? null, 'limit') ?? 3;
        $sessions = $this->workoutSessionRepository->findRecent(min($limit, 10));
        $items = array_map(fn (WorkoutSession $session): array => $this->workoutSessionAssembler->assemble($session), $sessions);

        return [
            'message' => $items === []
                ? 'No hay sesiones recientes.'
                : 'Sesiones recientes: '.implode('; ', array_map(
                    fn (array $item): string => sprintf('%d - %s (%s, %d ejercicios)', $item['id'], $item['displayName'], $item['sessionDate'], $item['exerciseCount']),
                    $items,
                )).'.',
            'items' => $items,
        ];
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function getSession(array $payload): array
    {
        $session = $this->findSession($this->positiveInt($payload['sessionId'] ?? null, 'sessionId'));
        $item = $this->workoutSessionAssembler->assemble($session);

        return [
            'message' => $this->formatSessionDetail($item),
            'item' => $item,
        ];
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function createWorkoutSession(array $payload): array
    {
        $errors = [];
        $sessionDateValue = $payload['sessionDate'] ?? (new \DateTimeImmutable())->format('Y-m-d');
        $sessionDate = $this->validDate($sessionDateValue, 'sessionDate', $errors);
        $name = $this->optionalString($payload['name'] ?? null);
        $mood = $this->optionalMood($payload['mood'] ?? null, $errors);
        $notes = $this->optionalString($payload['notes'] ?? null);

        if ($errors !== []) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', $errors);
        }

        $session = new WorkoutSession($sessionDate, $name);
        $session->setMood($mood);
        $session->setNotes($notes);

        $this->entityManager->persist($session);
        $this->entityManager->flush();

        $item = $this->workoutSessionAssembler->assemble($session);

        return [
            'message' => sprintf('Sesión creada: %s (%s), id %d.', $item['displayName'], $item['sessionDate'], $item['id']),
            'item' => $item,
        ];
    }

    /** @param array<string, mixed> $payload */
    public function addStrengthEntry(array $payload): array
    {
        return $this->addEntry($payload, 'strength');
    }

    /** @param array<string, mixed> $payload */
    public function addCardioEntry(array $payload): array
    {
        return $this->addEntry($payload, 'cardio');
    }

    /** @param array<string, mixed> $payload */
    public function addCoreEntry(array $payload): array
    {
        return $this->addEntry($payload, 'core');
    }

    /** @param array<string, mixed> $payload */
    public function addOtherEntry(array $payload): array
    {
        return $this->addEntry($payload, 'other');
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    private function addEntry(array $payload, string $toolType): array
    {
        $session = $this->findSession($this->positiveInt($payload['sessionId'] ?? null, 'sessionId'));
        $exercise = $this->findExercise($this->positiveInt($payload['exerciseId'] ?? null, 'exerciseId'));

        if ($exercise->getType()->value !== $toolType) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'El tipo del ejercicio no coincide con la herramienta usada.', [
                'exerciseId' => sprintf('El ejercicio es de tipo %s.', $exercise->getType()->value),
            ]);
        }

        $entryPayload = [
            'exerciseId' => $exercise->getId(),
            'notes' => $this->optionalString($payload['notes'] ?? null),
            'sets' => $this->normalizeSets($payload['sets'] ?? null, $toolType),
        ];
        $input = $this->addWorkoutEntryInputFactory->fromArray($entryPayload);
        $errors = $this->addWorkoutEntryInputValidator->validate($input, $exercise->getType());

        if ($errors !== []) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', $errors);
        }

        $entry = $this->workoutEntryCreator->create($session, $exercise, $input);
        $item = $this->workoutSessionAssembler->assemble($session);

        return [
            'message' => sprintf('Registrado %s: %s.', $exercise->getName(), $this->formatSets($entryPayload['sets'], $toolType)),
            'item' => $item,
            'entryId' => $entry->getId(),
        ];
    }

    /**
     * @return list<array<string, int|float|string|null>>
     */
    private function normalizeSets(mixed $value, string $toolType): array
    {
        if (!is_array($value) || $value === []) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', ['sets' => 'Debes añadir al menos una serie.']);
        }

        $sets = [];
        foreach ($value as $index => $set) {
            if (!is_array($set)) {
                throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', [sprintf('sets.%d', $index) => 'La serie debe ser un objeto.']);
            }

            $sets[] = match ($toolType) {
                'strength' => [
                    'setNumber' => $this->optionalPositiveInt($set['setNumber'] ?? null, sprintf('sets.%d.setNumber', $index)) ?? $index + 1,
                    'weightKg' => $this->optionalPositiveNumber($set['weightKg'] ?? null, sprintf('sets.%d.weightKg', $index)),
                    'reps' => $this->optionalPositiveInt($set['reps'] ?? null, sprintf('sets.%d.reps', $index)),
                    'durationSeconds' => null,
                    'distanceMeters' => null,
                    'speedKmh' => null,
                    'incline' => null,
                    'resistanceLevel' => null,
                    'calories' => null,
                    'notes' => $this->optionalString($set['notes'] ?? null),
                ],
                'cardio' => [
                    'setNumber' => $this->optionalPositiveInt($set['setNumber'] ?? null, sprintf('sets.%d.setNumber', $index)) ?? $index + 1,
                    'weightKg' => null,
                    'reps' => null,
                    'durationSeconds' => $this->optionalPositiveInt($set['durationSeconds'] ?? null, sprintf('sets.%d.durationSeconds', $index)),
                    'distanceMeters' => $this->optionalPositiveNumber($set['distanceMeters'] ?? null, sprintf('sets.%d.distanceMeters', $index)),
                    'speedKmh' => $this->optionalPositiveNumber($set['speedKmh'] ?? null, sprintf('sets.%d.speedKmh', $index)),
                    'incline' => $this->optionalNumber($set['incline'] ?? null, sprintf('sets.%d.incline', $index)),
                    'resistanceLevel' => $this->optionalNonNegativeInt($set['resistanceLevel'] ?? null, sprintf('sets.%d.resistanceLevel', $index)),
                    'calories' => $this->optionalNonNegativeInt($set['calories'] ?? null, sprintf('sets.%d.calories', $index)),
                    'notes' => $this->optionalString($set['notes'] ?? null),
                ],
                default => [
                    'setNumber' => $this->optionalPositiveInt($set['setNumber'] ?? null, sprintf('sets.%d.setNumber', $index)) ?? $index + 1,
                    'weightKg' => null,
                    'reps' => $this->optionalPositiveInt($set['reps'] ?? null, sprintf('sets.%d.reps', $index)),
                    'durationSeconds' => $this->optionalPositiveInt($set['durationSeconds'] ?? null, sprintf('sets.%d.durationSeconds', $index)),
                    'distanceMeters' => null,
                    'speedKmh' => null,
                    'incline' => null,
                    'resistanceLevel' => null,
                    'calories' => null,
                    'notes' => $this->optionalString($set['notes'] ?? null),
                ],
            };
        }

        return $sets;
    }

    private function findSession(int $sessionId): WorkoutSession
    {
        $session = $this->workoutSessionRepository->find($sessionId);

        if (!$session instanceof WorkoutSession) {
            throw new AssistantToolException(Response::HTTP_NOT_FOUND, 'Sesión no encontrada.');
        }

        return $session;
    }

    private function findExercise(int $exerciseId): Exercise
    {
        $exercise = $this->exerciseRepository->find($exerciseId);

        if (!$exercise instanceof Exercise || !$exercise->isActive()) {
            throw new AssistantToolException(Response::HTTP_NOT_FOUND, 'Ejercicio no encontrado.');
        }

        return $exercise;
    }

    /** @param array<string, mixed> $item */
    private function formatSessionDetail(array $item): string
    {
        $entries = $item['entries'] === []
            ? 'sin ejercicios registrados'
            : implode('; ', array_map(
                fn (array $entry): string => sprintf('%s: %d series', $entry['exerciseName'], count($entry['sets'])),
                $item['entries'],
            ));

        return sprintf('%s (%s): %s.', $item['displayName'], $item['sessionDate'], $entries);
    }

    /** @param list<array<string, int|float|string|null>> $sets */
    private function formatSets(array $sets, string $toolType): string
    {
        return implode(', ', array_map(function (array $set) use ($toolType): string {
            if ($toolType === 'strength') {
                if ($set['weightKg'] !== null && $set['reps'] !== null) {
                    return sprintf('%skg x %d', $this->formatFloat((float) $set['weightKg']), $set['reps']);
                }

                return $set['weightKg'] !== null ? sprintf('%skg', $this->formatFloat((float) $set['weightKg'])) : sprintf('%d reps', $set['reps']);
            }

            if ($toolType === 'cardio') {
                return implode(' / ', array_filter([
                    $set['durationSeconds'] !== null ? $this->formatDuration((int) $set['durationSeconds']) : null,
                    $set['distanceMeters'] !== null ? $this->formatFloat((float) $set['distanceMeters']).'m' : null,
                    $set['speedKmh'] !== null ? $this->formatFloat((float) $set['speedKmh']).'km/h' : null,
                ]));
            }

            return implode(' / ', array_filter([
                $set['reps'] !== null ? sprintf('%d reps', $set['reps']) : null,
                $set['durationSeconds'] !== null ? $this->formatDuration((int) $set['durationSeconds']) : null,
            ]));
        }, $sets));
    }

    private function validDate(mixed $value, string $field, array &$errors): \DateTimeImmutable
    {
        if (!is_string($value)) {
            $errors[$field] = 'La fecha debe tener formato YYYY-MM-DD.';

            return new \DateTimeImmutable();
        }

        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        $dateErrors = \DateTimeImmutable::getLastErrors();

        if (!$date instanceof \DateTimeImmutable || $date->format('Y-m-d') !== $value || ($dateErrors !== false && ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0))) {
            $errors[$field] = 'La fecha debe tener formato YYYY-MM-DD.';

            return new \DateTimeImmutable();
        }

        return $date;
    }

    /** @param array<string, string> $errors */
    private function optionalMood(mixed $value, array &$errors): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!is_string($value) || !in_array($value, self::MOODS, true)) {
            $errors['mood'] = 'La sensación general no es válida.';

            return null;
        }

        return $value;
    }

    private function optionalString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function positiveInt(mixed $value, string $field): int
    {
        if (!is_int($value) || $value <= 0) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', [$field => 'Debe ser un entero positivo.']);
        }

        return $value;
    }

    private function optionalPositiveInt(mixed $value, string $field): ?int
    {
        if ($value === null) {
            return null;
        }
        if (!is_int($value) || $value <= 0) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', [$field => 'Debe ser un entero positivo.']);
        }

        return $value;
    }

    private function optionalNonNegativeInt(mixed $value, string $field): ?int
    {
        if ($value === null) {
            return null;
        }
        if (!is_int($value) || $value < 0) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', [$field => 'Debe ser un entero no negativo.']);
        }

        return $value;
    }

    private function optionalPositiveNumber(mixed $value, string $field): ?float
    {
        if ($value === null) {
            return null;
        }
        if (!is_int($value) && !is_float($value)) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', [$field => 'Debe ser un número positivo.']);
        }
        if ($value <= 0) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', [$field => 'Debe ser un número positivo.']);
        }

        return (float) $value;
    }

    private function optionalNumber(mixed $value, string $field): ?float
    {
        if ($value === null) {
            return null;
        }
        if (!is_int($value) && !is_float($value)) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', [$field => 'Debe ser un número.']);
        }

        return (float) $value;
    }

    private function formatDuration(int $seconds): string
    {
        return $seconds % 60 === 0 ? (int) ($seconds / 60).'min' : $seconds.'s';
    }

    private function formatFloat(float $value): string
    {
        return rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');
    }
}
