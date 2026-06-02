<?php

declare(strict_types=1);

namespace App\Application\Assembler;

use App\Entity\ExerciseType;
use App\Entity\WorkoutEntry;
use App\Entity\WorkoutSession;
use App\Entity\WorkoutSet;

/**
 * Traduce entidades de sesion a contratos JSON estables.
 */
final class WorkoutSessionAssembler
{
    /**
     * @var array<string, string>
     */
    private const MOOD_LABELS = [
        'mala' => 'Mala',
        'normal' => 'Normal',
        'buena' => 'Buena',
        'muy_buena' => 'Muy buena',
    ];

    /**
     * @return array{id:int|null,name:string|null,displayName:string,sessionDate:string,mood:string|null,moodLabel:string|null,notes:string|null,startedAt:string|null,finishedAt:string|null,exerciseCount:int,setCount:int,totalVolumeKg:float,cardioDurationSeconds:int,entries:list<array{id:int|null,exerciseId:int,exerciseName:string,type:string,typeLabel:string,notes:string|null,sets:list<array{setNumber:int,weightKg:float|null,reps:int|null,durationSeconds:int|null,distanceMeters:float|null,speedKmh:float|null,incline:float|null,resistanceLevel:int|null,calories:int|null,notes:string|null}>}>}
     */
    public function assemble(WorkoutSession $session): array
    {
        $entries = $session->getWorkoutEntries()->toArray();
        usort($entries, fn (WorkoutEntry $a, WorkoutEntry $b): int => $a->getOrderIndex() <=> $b->getOrderIndex());

        $serializedEntries = array_map(fn (WorkoutEntry $entry): array => $this->serializeWorkoutEntry($entry), $entries);
        $setCount = 0;
        $totalVolumeKg = 0.0;
        $cardioDurationSeconds = 0;

        foreach ($entries as $entry) {
            foreach ($entry->getWorkoutSets() as $set) {
                ++$setCount;
                if ($set->getWeightKg() !== null && $set->getReps() !== null) {
                    $totalVolumeKg += $set->getWeightKg() * $set->getReps();
                }
                if ($set->getDurationSeconds() !== null) {
                    $cardioDurationSeconds += $set->getDurationSeconds();
                }
            }
        }

        return [
            'id' => $session->getId(),
            'name' => $session->getName(),
            'displayName' => $session->getName() ?? 'Entrenamiento',
            'sessionDate' => $session->getSessionDate()->format('Y-m-d'),
            'mood' => $session->getMood(),
            'moodLabel' => $session->getMood() !== null ? self::MOOD_LABELS[$session->getMood()] : null,
            'notes' => $session->getNotes(),
            'startedAt' => $session->getStartedAt()?->format(\DateTimeInterface::ATOM),
            'finishedAt' => $session->getFinishedAt()?->format(\DateTimeInterface::ATOM),
            'exerciseCount' => count($entries),
            'setCount' => $setCount,
            'totalVolumeKg' => $totalVolumeKg,
            'cardioDurationSeconds' => $cardioDurationSeconds,
            'entries' => $serializedEntries,
        ];
    }

    /**
     * @return array{id:int|null,name:string|null,displayName:string,sessionDate:string,mood:string|null,moodLabel:string|null,notes:string|null,startedAt:string|null,finishedAt:string|null,exerciseCount:int,setCount:int,totalVolumeKg:float,cardioDurationSeconds:int,entries:list<array{}>}
     */
    public function assembleSummary(WorkoutSession $session): array
    {
        $entries = $session->getWorkoutEntries();
        $setCount = 0;
        $totalVolumeKg = 0.0;
        $cardioDurationSeconds = 0;

        foreach ($entries as $entry) {
            foreach ($entry->getWorkoutSets() as $set) {
                ++$setCount;
                if ($set->getWeightKg() !== null && $set->getReps() !== null) {
                    $totalVolumeKg += $set->getWeightKg() * $set->getReps();
                }
                if ($set->getDurationSeconds() !== null) {
                    $cardioDurationSeconds += $set->getDurationSeconds();
                }
            }
        }

        return [
            'id' => $session->getId(),
            'name' => $session->getName(),
            'displayName' => $session->getName() ?? 'Entrenamiento',
            'sessionDate' => $session->getSessionDate()->format('Y-m-d'),
            'mood' => $session->getMood(),
            'moodLabel' => $session->getMood() !== null ? self::MOOD_LABELS[$session->getMood()] : null,
            'notes' => $session->getNotes(),
            'startedAt' => $session->getStartedAt()?->format(\DateTimeInterface::ATOM),
            'finishedAt' => $session->getFinishedAt()?->format(\DateTimeInterface::ATOM),
            'exerciseCount' => $entries->count(),
            'setCount' => $setCount,
            'totalVolumeKg' => $totalVolumeKg,
            'cardioDurationSeconds' => $cardioDurationSeconds,
            'entries' => [],
        ];
    }

    /**
     * @return array{id:int|null,exerciseId:int,exerciseName:string,type:string,typeLabel:string,notes:string|null,sets:list<array{setNumber:int,weightKg:float|null,reps:int|null,durationSeconds:int|null,distanceMeters:float|null,speedKmh:float|null,incline:float|null,resistanceLevel:int|null,calories:int|null,notes:string|null}>}
     */
    private function serializeWorkoutEntry(WorkoutEntry $entry): array
    {
        $sets = $entry->getWorkoutSets()->toArray();
        usort($sets, fn (WorkoutSet $a, WorkoutSet $b): int => $a->getSetNumber() <=> $b->getSetNumber());

        return [
            'id' => $entry->getId(),
            'exerciseId' => $entry->getExercise()->getId(),
            'exerciseName' => $entry->getExercise()->getName(),
            'type' => $entry->getExercise()->getType()->value,
            'typeLabel' => $this->typeLabel($entry->getExercise()->getType()),
            'notes' => $entry->getNotes(),
            'sets' => array_map(fn (WorkoutSet $set): array => $this->serializeWorkoutSet($set), $sets),
        ];
    }

    /**
     * @return array{setNumber:int,weightKg:float|null,reps:int|null,durationSeconds:int|null,distanceMeters:float|null,speedKmh:float|null,incline:float|null,resistanceLevel:int|null,calories:int|null,notes:string|null}
     */
    private function serializeWorkoutSet(WorkoutSet $set): array
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

    private function typeLabel(ExerciseType $type): string
    {
        return match ($type) {
            ExerciseType::Strength => 'Fuerza',
            ExerciseType::Cardio => 'Cardio',
            ExerciseType::Core => 'Abdomen',
            ExerciseType::Other => 'Otros',
        };
    }
}
