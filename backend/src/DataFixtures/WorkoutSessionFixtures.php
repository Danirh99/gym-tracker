<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\WorkoutSession;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

final class WorkoutSessionFixtures extends Fixture
{
    public const PUSH_DAY = 'session.push_day';
    public const LEGS_DAY = 'session.legs_day';
    public const CARDIO_CORE = 'session.cardio_core';

    public function load(ObjectManager $manager): void
    {
        $sessions = [
            [
                self::PUSH_DAY,
                new \DateTimeImmutable('-6 days'),
                'Push day',
                'muy_buena',
                'Buen nivel de energía y técnica sólida.',
                new \DateTimeImmutable('-6 days 18:00'),
                new \DateTimeImmutable('-6 days 19:05'),
            ],
            [
                self::LEGS_DAY,
                new \DateTimeImmutable('-4 days'),
                'Leg day',
                'normal',
                'Subí carga en sentadilla sin dolor.',
                new \DateTimeImmutable('-4 days 17:40'),
                new \DateTimeImmutable('-4 days 18:50'),
            ],
            [
                self::CARDIO_CORE,
                new \DateTimeImmutable('-2 days'),
                'Cardio + core',
                'buena',
                'Enfoque en constancia y respiración.',
                new \DateTimeImmutable('-2 days 07:10'),
                new \DateTimeImmutable('-2 days 08:00'),
            ],
        ];

        foreach ($sessions as [$reference, $sessionDate, $name, $mood, $notes, $startedAt, $finishedAt]) {
            $session = new WorkoutSession($sessionDate, $name);
            $session
                ->setMood($mood)
                ->setNotes($notes)
                ->setStartedAt($startedAt)
                ->setFinishedAt($finishedAt);

            $manager->persist($session);
            $this->addReference($reference, $session);
        }

        $manager->flush();
    }
}
