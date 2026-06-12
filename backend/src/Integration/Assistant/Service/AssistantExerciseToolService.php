<?php

declare(strict_types=1);

namespace App\Integration\Assistant\Service;

use App\Application\Service\ExerciseProgressRecommendationService;
use App\Entity\Exercise;
use App\Entity\ExerciseType;
use App\Entity\WorkoutEntry;
use App\Entity\WorkoutSet;
use App\Integration\Assistant\Exception\AssistantToolException;
use App\Repository\ExerciseRepository;
use App\Repository\WorkoutEntryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Response;

final class AssistantExerciseToolService
{
    public function __construct(
        private readonly ExerciseRepository $exerciseRepository,
        private readonly WorkoutEntryRepository $workoutEntryRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly ExerciseProgressRecommendationService $recommendationService,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function listExercises(array $payload): array
    {
        $query = $this->optionalString($payload['query'] ?? null);
        $exercises = $this->exerciseRepository->findActiveOrderedByName();

        if ($query !== null) {
            $normalizedQuery = mb_strtolower($query);
            $exercises = array_values(array_filter(
                $exercises,
                fn (Exercise $exercise): bool => str_contains(mb_strtolower($exercise->getName()), $normalizedQuery),
            ));
        }

        $items = array_map(fn (Exercise $exercise): array => $this->serializeExercise($exercise), $exercises);

        return [
            'message' => $items === []
                ? 'No he encontrado ejercicios.'
                : 'Ejercicios encontrados: '.implode('; ', array_map(
                    fn (array $item): string => sprintf('%d - %s (%s)', $item['id'], $item['name'], $item['typeLabel']),
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
    public function createExercise(array $payload): array
    {
        $errors = [];
        $name = $this->requiredString($payload['name'] ?? null, 'name', $errors);
        $type = is_string($payload['type'] ?? null) ? ExerciseType::tryFrom($payload['type']) : null;

        if (!$type instanceof ExerciseType) {
            $errors['type'] = 'El tipo de ejercicio no es válido.';
        }

        $muscleGroups = $this->stringList($payload['muscleGroups'] ?? []);
        if ($muscleGroups === null) {
            $errors['muscleGroups'] = 'Los músculos trabajados no son válidos.';
            $muscleGroups = [];
        }

        $notes = $this->optionalString($payload['notes'] ?? null);

        if ($errors !== []) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', $errors);
        }

        $exercise = new Exercise($name, $type);
        $exercise->setMuscleGroups($muscleGroups);
        $exercise->setNotes($notes);

        $this->entityManager->persist($exercise);
        $this->entityManager->flush();

        $item = $this->serializeExercise($exercise);

        return [
            'message' => sprintf('Ejercicio creado: %s (%s).', $item['name'], $item['typeLabel']),
            'item' => $item,
        ];
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function getExerciseProgress(array $payload): array
    {
        $exerciseId = $this->positiveInt($payload['exerciseId'] ?? null, 'exerciseId');
        $exercise = $this->exerciseRepository->find($exerciseId);

        if (!$exercise instanceof Exercise || !$exercise->isActive()) {
            throw new AssistantToolException(Response::HTTP_NOT_FOUND, 'Ejercicio no encontrado.');
        }

        $entries = $this->workoutEntryRepository->createQueryBuilder('entry')
            ->join('entry.workoutSession', 'session')
            ->addSelect('session')
            ->leftJoin('entry.workoutSets', 'workoutSet')
            ->addSelect('workoutSet')
            ->andWhere('entry.exercise = :exercise')
            ->setParameter('exercise', $exercise)
            ->orderBy('session.sessionDate', 'DESC')
            ->addOrderBy('entry.id', 'DESC')
            ->getQuery()
            ->getResult();

        $entries = array_values(array_filter($entries, fn (mixed $entry): bool => $entry instanceof WorkoutEntry));
        $items = array_map(fn (WorkoutEntry $entry): array => $this->serializeProgressEntry($entry), $entries);
        $summary = $this->buildSummary($entries);
        $recommendation = $this->recommendationService->recommend($exercise, $items);
        $messageParts = [
            sprintf('%s: %d sesiones', $exercise->getName(), $summary['sessions']),
            $summary['lastTopSet'] !== null ? 'última marca '.$summary['lastTopSet'] : null,
            $summary['bestTopSet'] !== null ? 'mejor marca '.$summary['bestTopSet'] : null,
            isset($recommendation['reason']) ? 'recomendación: '.$recommendation['reason'] : null,
        ];

        return [
            'message' => implode(', ', array_filter($messageParts)).'.',
            'item' => $this->serializeExercise($exercise),
            'summary' => $summary,
            'recommendation' => $recommendation,
            'items' => $items,
        ];
    }

    /**
     * @return array{id:int|null,name:string,type:string,typeLabel:string,muscleGroups:list<string>,notes:string|null}
     */
    private function serializeExercise(Exercise $exercise): array
    {
        return [
            'id' => $exercise->getId(),
            'name' => $exercise->getName(),
            'type' => $exercise->getType()->value,
            'typeLabel' => $this->typeLabel($exercise->getType()),
            'muscleGroups' => $exercise->getMuscleGroups(),
            'notes' => $exercise->getNotes(),
        ];
    }

    /**
     * @return array{sessions:int,bestTopSet:string|null,lastTopSet:string|null,totalVolumeKg:float,totalDurationSeconds:int}
     */
    private function buildSummary(array $entries): array
    {
        $bestWeight = null;
        $bestReps = null;
        $lastTopSet = null;
        $totalVolume = 0.0;
        $totalDuration = 0;

        foreach ($entries as $entryIndex => $entry) {
            $entryTopSet = null;

            foreach ($entry->getWorkoutSets() as $set) {
                if ($set->getWeightKg() !== null && $set->getReps() !== null) {
                    $totalVolume += $set->getWeightKg() * $set->getReps();
                }
                if ($set->getDurationSeconds() !== null) {
                    $totalDuration += $set->getDurationSeconds();
                }

                $topSet = $this->topSetLabel($set);
                if ($entryTopSet === null && $topSet !== null) {
                    $entryTopSet = $topSet;
                }

                if ($set->getWeightKg() !== null && ($bestWeight === null || $set->getWeightKg() > $bestWeight)) {
                    $bestWeight = $set->getWeightKg();
                    $bestReps = $set->getReps();
                }
            }

            if ($entryIndex === 0) {
                $lastTopSet = $entryTopSet;
            }
        }

        return [
            'sessions' => count($entries),
            'bestTopSet' => $bestWeight !== null ? sprintf('%s kg%s', $this->formatFloat($bestWeight), $bestReps !== null ? ' x '.$bestReps : '') : null,
            'lastTopSet' => $lastTopSet,
            'totalVolumeKg' => $totalVolume,
            'totalDurationSeconds' => $totalDuration,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeProgressEntry(WorkoutEntry $entry): array
    {
        $sets = $entry->getWorkoutSets()->toArray();
        usort($sets, fn (WorkoutSet $a, WorkoutSet $b): int => $a->getSetNumber() <=> $b->getSetNumber());
        $volume = 0.0;
        $duration = 0;

        foreach ($sets as $set) {
            if ($set->getWeightKg() !== null && $set->getReps() !== null) {
                $volume += $set->getWeightKg() * $set->getReps();
            }
            if ($set->getDurationSeconds() !== null) {
                $duration += $set->getDurationSeconds();
            }
        }

        return [
            'sessionId' => $entry->getWorkoutSession()->getId(),
            'sessionDate' => $entry->getWorkoutSession()->getSessionDate()->format('Y-m-d'),
            'entryId' => $entry->getId(),
            'topSet' => isset($sets[0]) ? $this->topSetLabel($sets[0]) : null,
            'topSetWeightKg' => isset($sets[0]) ? $sets[0]->getWeightKg() : null,
            'topSetReps' => isset($sets[0]) ? $sets[0]->getReps() : null,
            'volumeKg' => $volume,
            'durationSeconds' => $duration,
            'setsCount' => count($sets),
            'sets' => array_map(fn (WorkoutSet $set): array => [
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
            ], $sets),
        ];
    }

    private function topSetLabel(WorkoutSet $set): ?string
    {
        if ($set->getWeightKg() !== null && $set->getReps() !== null) {
            return sprintf('%s kg x %d', $this->formatFloat($set->getWeightKg()), $set->getReps());
        }
        if ($set->getDurationSeconds() !== null && $set->getDistanceMeters() !== null) {
            return sprintf('%d min · %s km', (int) round($set->getDurationSeconds() / 60), $this->formatFloat($set->getDistanceMeters() / 1000));
        }
        if ($set->getReps() !== null) {
            return sprintf('%d reps', $set->getReps());
        }
        if ($set->getDurationSeconds() !== null) {
            return sprintf('%d s', $set->getDurationSeconds());
        }

        return null;
    }

    private function typeLabel(ExerciseType $type): string
    {
        return match ($type) {
            ExerciseType::Strength => 'Fuerza',
            ExerciseType::Cardio => 'Cardio',
            ExerciseType::Core => 'Abdomen',
            ExerciseType::Other => 'Otros',
        };
    }

    /** @param array<string, string> $errors */
    private function requiredString(mixed $value, string $field, array &$errors): string
    {
        if (!is_string($value) || trim($value) === '') {
            $errors[$field] = 'El campo '.$field.' es obligatorio.';

            return '';
        }

        return trim($value);
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    /** @return list<string>|null */
    private function stringList(mixed $value): ?array
    {
        if ($value === null) {
            return [];
        }
        if (!is_array($value)) {
            return null;
        }

        $items = [];
        foreach ($value as $item) {
            if (!is_string($item)) {
                return null;
            }
            $item = trim($item);
            if ($item !== '' && !in_array($item, $items, true)) {
                $items[] = $item;
            }
        }

        return $items;
    }

    private function positiveInt(mixed $value, string $field): int
    {
        if (!is_int($value) || $value <= 0) {
            throw new AssistantToolException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Hay errores de validación.', [$field => 'Debe ser un entero positivo.']);
        }

        return $value;
    }

    private function formatFloat(float $value): string
    {
        return rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');
    }
}
