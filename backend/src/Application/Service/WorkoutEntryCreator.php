<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Application\Dto\AddWorkoutEntryInput;
use App\Entity\Exercise;
use App\Entity\WorkoutEntry;
use App\Entity\WorkoutSession;
use App\Entity\WorkoutSet;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Caso de uso para construir y persistir una entrada de sesion.
 */
final class WorkoutEntryCreator
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function create(WorkoutSession $session, Exercise $exercise, AddWorkoutEntryInput $input): WorkoutEntry
    {
        $orderIndex = $session->getWorkoutEntries()->count() + 1;
        $entry = new WorkoutEntry($session, $exercise, $orderIndex);
        $entry->setNotes($input->notes !== '' ? $input->notes : null);

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

        $session->addWorkoutEntry($entry);
        $this->entityManager->persist($entry);
        $this->entityManager->flush();

        return $entry;
    }
}
