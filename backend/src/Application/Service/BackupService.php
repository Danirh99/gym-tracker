<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Entity\Exercise;
use App\Entity\ExerciseType;
use App\Entity\WorkoutEntry;
use App\Entity\WorkoutSession;
use App\Entity\WorkoutSet;
use App\Repository\ExerciseRepository;
use App\Repository\WorkoutSessionRepository;
use Doctrine\ORM\EntityManagerInterface;

final class BackupService
{
    private const SCHEMA_VERSION = 1;

    /**
     * @var array<string, string>
     */
    private const MOOD_LABELS = [
        'mala' => 'Mala',
        'normal' => 'Normal',
        'buena' => 'Buena',
        'muy_buena' => 'Muy buena',
    ];

    public function __construct(
        private readonly ExerciseRepository $exerciseRepository,
        private readonly WorkoutSessionRepository $workoutSessionRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return array{schemaVersion:int,app:string,exportedAt:string,exercises:list<array<string, mixed>>,workoutSessions:list<array<string, mixed>>}
     */
    public function export(): array
    {
        $exercises = $this->exerciseRepository->findAll();
        usort($exercises, fn (Exercise $a, Exercise $b): int => strcasecmp($a->getName(), $b->getName()));

        $sessions = $this->workoutSessionRepository->findAllOrdered();

        return [
            'schemaVersion' => self::SCHEMA_VERSION,
            'app' => 'gym-tracker',
            'exportedAt' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            'exercises' => array_map(fn (Exercise $exercise): array => $this->exportExercise($exercise), $exercises),
            'workoutSessions' => array_map(fn (WorkoutSession $session): array => $this->exportWorkoutSession($session), $sessions),
        ];
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array{exercisesCreated:int,exercisesMatched:int,sessionsCreated:int,sessionsSkipped:int}
     */
    public function import(array $payload): array
    {
        $errors = $this->validateBackup($payload);

        if ($errors !== []) {
            throw new BackupValidationException($errors);
        }

        /** @var list<array<string, mixed>> $exercisePayloads */
        $exercisePayloads = $payload['exercises'];
        /** @var list<array<string, mixed>> $sessionPayloads */
        $sessionPayloads = $payload['workoutSessions'];

        return $this->entityManager->wrapInTransaction(function () use ($exercisePayloads, $sessionPayloads): array {
            $result = [
                'exercisesCreated' => 0,
                'exercisesMatched' => 0,
                'sessionsCreated' => 0,
                'sessionsSkipped' => 0,
            ];

            $exercisesBySourceId = [];
            $existingExercisesByKey = [];

            foreach ($this->exerciseRepository->findAll() as $exercise) {
                if ($exercise instanceof Exercise) {
                    $existingExercisesByKey[$this->exerciseKey($exercise->getName(), $exercise->getType()->value)] = $exercise;
                }
            }

            foreach ($exercisePayloads as $exercisePayload) {
                $sourceId = (string) $exercisePayload['sourceId'];
                $type = ExerciseType::from($exercisePayload['type']);
                $key = $this->exerciseKey($exercisePayload['name'], $type->value);

                if (isset($existingExercisesByKey[$key])) {
                    $exercisesBySourceId[$sourceId] = $existingExercisesByKey[$key];
                    ++$result['exercisesMatched'];

                    continue;
                }

                $exercise = new Exercise(trim($exercisePayload['name']), $type);
                $exercise
                    ->setMuscleGroups($this->normalizeStringList($exercisePayload['muscleGroups']))
                    ->setNotes($this->normalizeOptionalString($exercisePayload['notes']))
                    ->setIsActive($exercisePayload['isActive']);

                $this->entityManager->persist($exercise);
                $existingExercisesByKey[$key] = $exercise;
                $exercisesBySourceId[$sourceId] = $exercise;
                ++$result['exercisesCreated'];
            }

            $existingSessionFingerprints = [];
            foreach ($this->workoutSessionRepository->findAllOrdered() as $session) {
                if ($session instanceof WorkoutSession) {
                    $existingSessionFingerprints[$this->fingerprintExistingSession($session)] = true;
                }
            }

            foreach ($sessionPayloads as $sessionPayload) {
                $fingerprint = $this->fingerprintImportedSession($sessionPayload, $exercisesBySourceId);

                if (isset($existingSessionFingerprints[$fingerprint])) {
                    ++$result['sessionsSkipped'];

                    continue;
                }

                $session = new WorkoutSession(
                    $this->parseDate($sessionPayload['sessionDate']),
                    $this->normalizeOptionalString($sessionPayload['name']),
                );
                $session
                    ->setMood($this->normalizeMood($sessionPayload['mood']))
                    ->setNotes($this->normalizeOptionalString($sessionPayload['notes']))
                    ->setStartedAt($this->parseNullableDateTime($sessionPayload['startedAt']))
                    ->setFinishedAt($this->parseNullableDateTime($sessionPayload['finishedAt']));

                $this->entityManager->persist($session);
                $this->addImportedEntries($session, $sessionPayload, $exercisesBySourceId);
                $existingSessionFingerprints[$fingerprint] = true;
                ++$result['sessionsCreated'];
            }

            return $result;
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function exportExercise(Exercise $exercise): array
    {
        return [
            'sourceId' => $exercise->getId(),
            'name' => $exercise->getName(),
            'type' => $exercise->getType()->value,
            'muscleGroups' => $exercise->getMuscleGroups(),
            'notes' => $exercise->getNotes(),
            'isActive' => $exercise->isActive(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function exportWorkoutSession(WorkoutSession $session): array
    {
        $entries = $session->getWorkoutEntries()->toArray();
        usort($entries, fn (WorkoutEntry $a, WorkoutEntry $b): int => $a->getOrderIndex() <=> $b->getOrderIndex());

        return [
            'sourceId' => $session->getId(),
            'name' => $session->getName(),
            'sessionDate' => $session->getSessionDate()->format('Y-m-d'),
            'mood' => $session->getMood(),
            'notes' => $session->getNotes(),
            'startedAt' => $session->getStartedAt()?->format(\DateTimeInterface::ATOM),
            'finishedAt' => $session->getFinishedAt()?->format(\DateTimeInterface::ATOM),
            'entries' => array_map(fn (WorkoutEntry $entry): array => $this->exportWorkoutEntry($entry), $entries),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function exportWorkoutEntry(WorkoutEntry $entry): array
    {
        $sets = $entry->getWorkoutSets()->toArray();
        usort($sets, fn (WorkoutSet $a, WorkoutSet $b): int => $a->getSetNumber() <=> $b->getSetNumber());

        return [
            'sourceId' => $entry->getId(),
            'exerciseSourceId' => $entry->getExercise()->getId(),
            'orderIndex' => $entry->getOrderIndex(),
            'notes' => $entry->getNotes(),
            'sets' => array_map(fn (WorkoutSet $set): array => $this->exportWorkoutSet($set), $sets),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function exportWorkoutSet(WorkoutSet $set): array
    {
        return [
            'setNumber' => $set->getSetNumber(),
            'weightKg' => $set->getWeightKg(),
            'reps' => $set->getReps(),
            'durationSeconds' => $set->getDurationSeconds(),
            'distanceMeters' => $set->getDistanceMeters(),
            'speedKmh' => $set->getSpeedKmh(),
            'incline' => $set->getIncline(),
            'resistanceLevel' => $set->getResistanceLevel(),
            'calories' => $set->getCalories(),
            'notes' => $set->getNotes(),
        ];
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, Exercise> $exercisesBySourceId
     */
    private function addImportedEntries(WorkoutSession $session, array $payload, array $exercisesBySourceId): void
    {
        foreach ($payload['entries'] as $entryPayload) {
            $exercise = $exercisesBySourceId[(string) $entryPayload['exerciseSourceId']];
            $entry = new WorkoutEntry($session, $exercise, $entryPayload['orderIndex']);
            $entry->setNotes($this->normalizeOptionalString($entryPayload['notes']));
            $session->addWorkoutEntry($entry);

            foreach ($entryPayload['sets'] as $setPayload) {
                $set = new WorkoutSet($entry, $setPayload['setNumber']);
                $set
                    ->setWeightKg($this->nullableFloat($setPayload['weightKg']))
                    ->setReps($setPayload['reps'])
                    ->setDurationSeconds($setPayload['durationSeconds'])
                    ->setDistanceMeters($this->nullableFloat($setPayload['distanceMeters']))
                    ->setSpeedKmh($this->nullableFloat($setPayload['speedKmh']))
                    ->setIncline($this->nullableFloat($setPayload['incline']))
                    ->setResistanceLevel($setPayload['resistanceLevel'])
                    ->setCalories($setPayload['calories'])
                    ->setNotes($this->normalizeOptionalString($setPayload['notes']));
                $entry->addWorkoutSet($set);
            }
        }
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return list<string>
     */
    private function validateBackup(array $payload): array
    {
        $errors = [];

        if (($payload['schemaVersion'] ?? null) !== self::SCHEMA_VERSION) {
            $errors[] = 'La version del backup no es compatible.';
        }

        if (($payload['app'] ?? null) !== 'gym-tracker') {
            $errors[] = 'El archivo no parece ser un backup de Gym Tracker.';
        }

        if (!isset($payload['exercises']) || !is_array($payload['exercises'])) {
            $errors[] = 'La lista de ejercicios no es valida.';
        }

        if (!isset($payload['workoutSessions']) || !is_array($payload['workoutSessions'])) {
            $errors[] = 'La lista de entrenamientos no es valida.';
        }

        if ($errors !== []) {
            return $errors;
        }

        $exerciseSourceIds = [];
        foreach ($payload['exercises'] as $index => $exercise) {
            if (!is_array($exercise)) {
                $errors[] = sprintf('El ejercicio #%d no es valido.', $index + 1);
                continue;
            }

            if (!isset($exercise['sourceId']) || !is_int($exercise['sourceId'])) {
                $errors[] = sprintf('El ejercicio #%d no tiene identificador valido.', $index + 1);
            } else {
                $exerciseSourceIds[(string) $exercise['sourceId']] = true;
            }

            foreach (['notes'] as $field) {
                if (!array_key_exists($field, $exercise)) {
                    $errors[] = sprintf('El campo %s del ejercicio #%d es obligatorio.', $field, $index + 1);
                }
            }

            if (!isset($exercise['name']) || !is_string($exercise['name']) || trim($exercise['name']) === '' || mb_strlen(trim($exercise['name'])) > 120) {
                $errors[] = sprintf('El nombre del ejercicio #%d no es valido.', $index + 1);
            }

            if (!isset($exercise['type']) || !is_string($exercise['type']) || ExerciseType::tryFrom($exercise['type']) === null) {
                $errors[] = sprintf('El tipo del ejercicio #%d no es valido.', $index + 1);
            }

            if (!isset($exercise['muscleGroups']) || !is_array($exercise['muscleGroups']) || !$this->isStringList($exercise['muscleGroups'])) {
                $errors[] = sprintf('Los grupos musculares del ejercicio #%d no son validos.', $index + 1);
            }

            if (($exercise['notes'] ?? null) !== null && !is_string($exercise['notes'])) {
                $errors[] = sprintf('Las notas del ejercicio #%d no son validas.', $index + 1);
            }

            if (!isset($exercise['isActive']) || !is_bool($exercise['isActive'])) {
                $errors[] = sprintf('El estado del ejercicio #%d no es valido.', $index + 1);
            }
        }

        foreach ($payload['workoutSessions'] as $sessionIndex => $session) {
            if (!is_array($session)) {
                $errors[] = sprintf('El entrenamiento #%d no es valido.', $sessionIndex + 1);
                continue;
            }

            $this->validateSession($session, $sessionIndex, $exerciseSourceIds, $errors);
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $session
     * @param array<string, true> $exerciseSourceIds
     * @param list<string> $errors
     */
    private function validateSession(array $session, int $sessionIndex, array $exerciseSourceIds, array &$errors): void
    {
        $label = sprintf('entrenamiento #%d', $sessionIndex + 1);

        if (!isset($session['sourceId']) || !is_int($session['sourceId'])) {
            $errors[] = sprintf('El %s no tiene identificador valido.', $label);
        }

        foreach (['name', 'mood', 'notes', 'startedAt', 'finishedAt'] as $field) {
            if (!array_key_exists($field, $session)) {
                $errors[] = sprintf('El campo %s del %s es obligatorio.', $field, $label);
            }
        }

        if (!isset($session['sessionDate']) || !is_string($session['sessionDate']) || !$this->isValidDate($session['sessionDate'])) {
            $errors[] = sprintf('La fecha del %s no es valida.', $label);
        }

        if (($session['name'] ?? null) !== null && (!is_string($session['name']) || mb_strlen(trim($session['name'])) > 120)) {
            $errors[] = sprintf('El nombre del %s no es valido.', $label);
        }

        if (($session['mood'] ?? null) !== null && (!is_string($session['mood']) || !array_key_exists($session['mood'], self::MOOD_LABELS))) {
            $errors[] = sprintf('La sensacion del %s no es valida.', $label);
        }

        foreach (['notes', 'startedAt', 'finishedAt'] as $field) {
            if (($session[$field] ?? null) !== null && !is_string($session[$field])) {
                $errors[] = sprintf('El campo %s del %s no es valido.', $field, $label);
            }
        }

        foreach (['startedAt', 'finishedAt'] as $field) {
            if (($session[$field] ?? null) !== null && !$this->isValidDateTime($session[$field])) {
                $errors[] = sprintf('El campo %s del %s no tiene una fecha valida.', $field, $label);
            }
        }

        if (!isset($session['entries']) || !is_array($session['entries'])) {
            $errors[] = sprintf('Las entradas del %s no son validas.', $label);
            return;
        }

        foreach ($session['entries'] as $entryIndex => $entry) {
            if (!is_array($entry)) {
                $errors[] = sprintf('La entrada #%d del %s no es valida.', $entryIndex + 1, $label);
                continue;
            }

            $this->validateEntry($entry, $entryIndex, $label, $exerciseSourceIds, $errors);
        }
    }

    /**
     * @param array<string, mixed> $entry
     * @param array<string, true> $exerciseSourceIds
     * @param list<string> $errors
     */
    private function validateEntry(array $entry, int $entryIndex, string $sessionLabel, array $exerciseSourceIds, array &$errors): void
    {
        $label = sprintf('entrada #%d del %s', $entryIndex + 1, $sessionLabel);

        if (!isset($entry['sourceId']) || !is_int($entry['sourceId'])) {
            $errors[] = sprintf('La %s no tiene identificador valido.', $label);
        }

        if (!array_key_exists('notes', $entry)) {
            $errors[] = sprintf('El campo notes de la %s es obligatorio.', $label);
        }

        if (!isset($entry['exerciseSourceId']) || !is_int($entry['exerciseSourceId']) || !isset($exerciseSourceIds[(string) $entry['exerciseSourceId']])) {
            $errors[] = sprintf('El ejercicio de la %s no existe en el backup.', $label);
        }

        if (!isset($entry['orderIndex']) || !is_int($entry['orderIndex']) || $entry['orderIndex'] < 1) {
            $errors[] = sprintf('El orden de la %s no es valido.', $label);
        }

        if (($entry['notes'] ?? null) !== null && !is_string($entry['notes'])) {
            $errors[] = sprintf('Las notas de la %s no son validas.', $label);
        }

        if (!isset($entry['sets']) || !is_array($entry['sets'])) {
            $errors[] = sprintf('Las series de la %s no son validas.', $label);
            return;
        }

        foreach ($entry['sets'] as $setIndex => $set) {
            if (!is_array($set)) {
                $errors[] = sprintf('La serie #%d de la %s no es valida.', $setIndex + 1, $label);
                continue;
            }

            $this->validateSet($set, $setIndex, $label, $errors);
        }
    }

    /**
     * @param array<string, mixed> $set
     * @param list<string> $errors
     */
    private function validateSet(array $set, int $setIndex, string $entryLabel, array &$errors): void
    {
        $label = sprintf('serie #%d de la %s', $setIndex + 1, $entryLabel);
        $expectedFields = ['setNumber', 'weightKg', 'reps', 'durationSeconds', 'distanceMeters', 'speedKmh', 'incline', 'resistanceLevel', 'calories', 'notes'];

        foreach ($expectedFields as $field) {
            if (!array_key_exists($field, $set)) {
                $errors[] = sprintf('El campo %s de la %s es obligatorio.', $field, $label);
            }
        }

        if (!isset($set['setNumber']) || !is_int($set['setNumber']) || $set['setNumber'] < 1) {
            $errors[] = sprintf('El numero de la %s no es valido.', $label);
        }

        foreach (['weightKg', 'distanceMeters', 'speedKmh', 'incline'] as $field) {
            if (($set[$field] ?? null) !== null && !is_int($set[$field]) && !is_float($set[$field])) {
                $errors[] = sprintf('El campo %s de la %s no es valido.', $field, $label);
            }
        }

        foreach (['reps', 'durationSeconds', 'resistanceLevel', 'calories'] as $field) {
            if (($set[$field] ?? null) !== null && (!is_int($set[$field]) || $set[$field] < 0)) {
                $errors[] = sprintf('El campo %s de la %s no es valido.', $field, $label);
            }
        }

        if (($set['notes'] ?? null) !== null && !is_string($set['notes'])) {
            $errors[] = sprintf('Las notas de la %s no son validas.', $label);
        }
    }

    /**
     * @param array<string, mixed> $sessionPayload
     * @param array<string, Exercise> $exercisesBySourceId
     */
    private function fingerprintImportedSession(array $sessionPayload, array $exercisesBySourceId): string
    {
        $entries = [];
        foreach ($sessionPayload['entries'] as $entryPayload) {
            $exercise = $exercisesBySourceId[(string) $entryPayload['exerciseSourceId']];
            $entries[] = [
                'exercise' => $this->exerciseKey($exercise->getName(), $exercise->getType()->value),
                'orderIndex' => $entryPayload['orderIndex'],
                'notes' => $this->normalizeOptionalString($entryPayload['notes']),
                'sets' => $entryPayload['sets'],
            ];
        }

        return hash('sha256', json_encode([
            'name' => $this->normalizeOptionalString($sessionPayload['name']),
            'sessionDate' => $sessionPayload['sessionDate'],
            'mood' => $this->normalizeMood($sessionPayload['mood']),
            'notes' => $this->normalizeOptionalString($sessionPayload['notes']),
            'entries' => $entries,
        ], \JSON_THROW_ON_ERROR));
    }

    private function fingerprintExistingSession(WorkoutSession $session): string
    {
        $entries = $session->getWorkoutEntries()->toArray();
        usort($entries, fn (WorkoutEntry $a, WorkoutEntry $b): int => $a->getOrderIndex() <=> $b->getOrderIndex());

        $serializedEntries = [];
        foreach ($entries as $entry) {
            $sets = $entry->getWorkoutSets()->toArray();
            usort($sets, fn (WorkoutSet $a, WorkoutSet $b): int => $a->getSetNumber() <=> $b->getSetNumber());

            $serializedEntries[] = [
                'exercise' => $this->exerciseKey($entry->getExercise()->getName(), $entry->getExercise()->getType()->value),
                'orderIndex' => $entry->getOrderIndex(),
                'notes' => $entry->getNotes(),
                'sets' => array_map(fn (WorkoutSet $set): array => $this->exportWorkoutSet($set), $sets),
            ];
        }

        return hash('sha256', json_encode([
            'name' => $session->getName(),
            'sessionDate' => $session->getSessionDate()->format('Y-m-d'),
            'mood' => $session->getMood(),
            'notes' => $session->getNotes(),
            'entries' => $serializedEntries,
        ], \JSON_THROW_ON_ERROR));
    }

    private function exerciseKey(string $name, string $type): string
    {
        return mb_strtolower(trim($name)).'|'.$type;
    }

    /**
     * @param array<mixed> $items
     */
    private function isStringList(array $items): bool
    {
        foreach ($items as $item) {
            if (!is_string($item)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param array<mixed> $items
     *
     * @return list<string>
     */
    private function normalizeStringList(array $items): array
    {
        $values = [];
        foreach ($items as $item) {
            if (!is_string($item)) {
                continue;
            }

            $value = trim($item);
            if ($value !== '' && !in_array($value, $values, true)) {
                $values[] = $value;
            }
        }

        return $values;
    }

    private function normalizeOptionalString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function normalizeMood(mixed $value): ?string
    {
        return is_string($value) && array_key_exists($value, self::MOOD_LABELS) ? $value : null;
    }

    private function nullableFloat(mixed $value): ?float
    {
        return is_int($value) || is_float($value) ? (float) $value : null;
    }

    private function parseDate(string $value): \DateTimeImmutable
    {
        return \DateTimeImmutable::createFromFormat('!Y-m-d', $value) ?: new \DateTimeImmutable($value);
    }

    private function parseNullableDateTime(mixed $value): ?\DateTimeImmutable
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        return new \DateTimeImmutable($value);
    }

    private function isValidDate(string $value): bool
    {
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        return $date instanceof \DateTimeImmutable && $date->format('Y-m-d') === $value;
    }

    private function isValidDateTime(string $value): bool
    {
        try {
            new \DateTimeImmutable($value);

            return true;
        } catch (\Exception) {
            return false;
        }
    }
}
