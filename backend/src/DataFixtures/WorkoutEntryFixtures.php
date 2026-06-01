<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\Exercise;
use App\Entity\WorkoutEntry;
use App\Entity\WorkoutSession;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

final class WorkoutEntryFixtures extends Fixture implements DependentFixtureInterface
{
    public const PUSH_BENCH = 'entry.push.bench';
    public const LEGS_SQUAT = 'entry.legs.squat';
    public const CARDIO_RUN = 'entry.cardio.run';
    public const CARDIO_PLANK = 'entry.cardio.plank';

    public function load(ObjectManager $manager): void
    {
        $entries = [
            [self::PUSH_BENCH, WorkoutSessionFixtures::PUSH_DAY, ExerciseFixtures::BENCH_PRESS, 1, 'Última serie cerca del fallo técnico.'],
            [self::LEGS_SQUAT, WorkoutSessionFixtures::LEGS_DAY, ExerciseFixtures::BACK_SQUAT, 1, 'Controlando tempo en la bajada.'],
            [self::CARDIO_RUN, WorkoutSessionFixtures::CARDIO_CORE, ExerciseFixtures::TREADMILL_RUN, 1, 'Bloques de ritmo progresivo.'],
            [self::CARDIO_PLANK, WorkoutSessionFixtures::CARDIO_CORE, ExerciseFixtures::PLANK, 2, 'Core activo durante toda la sesión.'],
        ];

        foreach ($entries as [$reference, $sessionRef, $exerciseRef, $orderIndex, $notes]) {
            /** @var WorkoutSession $session */
            $session = $this->getReference($sessionRef, WorkoutSession::class);
            /** @var Exercise $exercise */
            $exercise = $this->getReference($exerciseRef, Exercise::class);

            $entry = new WorkoutEntry($session, $exercise, $orderIndex);
            $entry->setNotes($notes);

            $session->addWorkoutEntry($entry);
            $manager->persist($entry);
            $this->addReference($reference, $entry);
        }

        $manager->flush();
    }

    public function getDependencies(): array
    {
        return [
            ExerciseFixtures::class,
            WorkoutSessionFixtures::class,
        ];
    }
}
