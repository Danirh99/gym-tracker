<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Application\Dto\AddWorkoutEntryInput;
use App\Entity\Exercise;
use App\Entity\WorkoutEntry;
use App\Entity\WorkoutSet;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Caso de uso para actualizar una entrada existente sustituyendo sus series.
 */
final class WorkoutEntryUpdater
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function update(WorkoutEntry $entry, Exercise $exercise, AddWorkoutEntryInput $input): WorkoutEntry
    {
        $entry->setExercise($exercise);
        $entry->setNotes($input->notes !== '' ? $input->notes : null);

        foreach ($entry->getWorkoutSets() as $existingSet) {
            $entry->removeWorkoutSet($existingSet);
            $this->entityManager->remove($existingSet);
        }

        foreach ($input->sets as $setInput) {
            $set = new WorkoutSet($entry, $setInput->setNumber);
            $set->setWeightKg($setInput->weightKg);
            $set->setReps($setInput->reps);
            $set->setDurationSeconds($setInput->durationSeconds);
            $set->setDistanceMeters($setInput->distanceMeters);
            $set->setSpeedKmh($setInput->speedKmh);
            $set->setIncline($setInput->incline);
            $set->setResistanceLevel($setInput->resistanceLevel);
            $set->setCalories($setInput->calories);
            $set->setNotes($setInput->notes !== '' ? $setInput->notes : null);
            $entry->addWorkoutSet($set);
        }

        $this->entityManager->flush();

        return $entry;
    }
}
