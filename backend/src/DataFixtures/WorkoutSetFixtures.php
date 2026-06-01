<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\WorkoutEntry;
use App\Entity\WorkoutSet;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

final class WorkoutSetFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        $benchEntry = $this->getReference(WorkoutEntryFixtures::PUSH_BENCH, WorkoutEntry::class);

        $benchSet1 = (new WorkoutSet($benchEntry, 1))
            ->setWeightKg(60.0)
            ->setReps(10)
            ->setNotes('RPE 7');
        $benchSet2 = (new WorkoutSet($benchEntry, 2))
            ->setWeightKg(67.5)
            ->setReps(8)
            ->setNotes('RPE 8');
        $benchSet3 = (new WorkoutSet($benchEntry, 3))
            ->setWeightKg(72.5)
            ->setReps(6)
            ->setNotes('RPE 9');

        $benchEntry->addWorkoutSet($benchSet1);
        $benchEntry->addWorkoutSet($benchSet2);
        $benchEntry->addWorkoutSet($benchSet3);

        $squatEntry = $this->getReference(WorkoutEntryFixtures::LEGS_SQUAT, WorkoutEntry::class);

        $squatSet1 = (new WorkoutSet($squatEntry, 1))
            ->setWeightKg(90.0)
            ->setReps(8);
        $squatSet2 = (new WorkoutSet($squatEntry, 2))
            ->setWeightKg(100.0)
            ->setReps(6)
            ->setNotes('Última repetición lenta.');

        $squatEntry->addWorkoutSet($squatSet1);
        $squatEntry->addWorkoutSet($squatSet2);

        $runEntry = $this->getReference(WorkoutEntryFixtures::CARDIO_RUN, WorkoutEntry::class);

        $runSet1 = (new WorkoutSet($runEntry, 1))
            ->setDurationSeconds(900)
            ->setDistanceMeters(2500)
            ->setSpeedKmh(10.0)
            ->setIncline(1.0)
            ->setCalories(180);
        $runSet2 = (new WorkoutSet($runEntry, 2))
            ->setDurationSeconds(600)
            ->setDistanceMeters(1800)
            ->setSpeedKmh(10.8)
            ->setIncline(2.0)
            ->setCalories(135)
            ->setNotes('Bloque final con más intensidad.');

        $runEntry->addWorkoutSet($runSet1);
        $runEntry->addWorkoutSet($runSet2);

        $plankEntry = $this->getReference(WorkoutEntryFixtures::CARDIO_PLANK, WorkoutEntry::class);

        $plankSet1 = (new WorkoutSet($plankEntry, 1))
            ->setDurationSeconds(60)
            ->setNotes('Respiración nasal.');
        $plankSet2 = (new WorkoutSet($plankEntry, 2))
            ->setDurationSeconds(75);
        $plankSet3 = (new WorkoutSet($plankEntry, 3))
            ->setDurationSeconds(90)
            ->setNotes('Buena estabilidad de cadera.');

        $plankEntry->addWorkoutSet($plankSet1);
        $plankEntry->addWorkoutSet($plankSet2);
        $plankEntry->addWorkoutSet($plankSet3);

        $manager->flush();
    }

    public function getDependencies(): array
    {
        return [
            WorkoutEntryFixtures::class,
        ];
    }
}
