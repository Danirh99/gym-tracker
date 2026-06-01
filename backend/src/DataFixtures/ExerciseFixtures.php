<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\Exercise;
use App\Entity\ExerciseType;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

final class ExerciseFixtures extends Fixture
{
    public const BENCH_PRESS = 'exercise.bench_press';
    public const BACK_SQUAT = 'exercise.back_squat';
    public const DEADLIFT = 'exercise.deadlift';
    public const TREADMILL_RUN = 'exercise.treadmill_run';
    public const BIKE = 'exercise.bike';
    public const PLANK = 'exercise.plank';
    public const HANGING_KNEE_RAISE = 'exercise.hanging_knee_raise';
    public const JUMP_ROPE = 'exercise.jump_rope';

    public function load(ObjectManager $manager): void
    {
        $exercises = [
            [self::BENCH_PRESS, 'Bench Press', ExerciseType::Strength, ['chest', 'triceps', 'front_delts'], 'Controla la bajada y mantén escápulas retraídas.', true],
            [self::BACK_SQUAT, 'Back Squat', ExerciseType::Strength, ['quads', 'glutes', 'core'], 'Profundidad paralela sin perder la técnica.', true],
            [self::DEADLIFT, 'Deadlift', ExerciseType::Strength, ['hamstrings', 'glutes', 'lower_back'], 'Barra pegada al cuerpo durante todo el recorrido.', true],
            [self::TREADMILL_RUN, 'Treadmill Run', ExerciseType::Cardio, ['legs', 'cardio'], 'Incrementa velocidad de forma progresiva.', true],
            [self::BIKE, 'Stationary Bike', ExerciseType::Cardio, ['legs', 'cardio'], 'Mantén cadencia estable y respiración controlada.', true],
            [self::PLANK, 'Plank', ExerciseType::Core, ['core', 'abs'], 'Evita arquear la zona lumbar.', true],
            [self::HANGING_KNEE_RAISE, 'Hanging Knee Raise', ExerciseType::Core, ['core', 'hip_flexors'], 'Sube las rodillas sin balancearte.', true],
            [self::JUMP_ROPE, 'Jump Rope', ExerciseType::Other, ['cardio', 'calves'], 'Ejercicio guardado como histórico para referencia.', false],
        ];

        foreach ($exercises as [$reference, $name, $type, $muscleGroups, $notes, $isActive]) {
            $exercise = new Exercise($name, $type);
            $exercise
                ->setMuscleGroups($muscleGroups)
                ->setNotes($notes)
                ->setIsActive($isActive);

            $manager->persist($exercise);
            $this->addReference($reference, $exercise);
        }

        $manager->flush();
    }
}
