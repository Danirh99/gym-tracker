<?php

declare(strict_types=1);

namespace App\Tests\Application\Service;

use App\Application\Service\BackupService;
use App\Application\Service\BackupValidationException;
use App\Entity\Exercise;
use App\Entity\ExerciseType;
use App\Entity\WorkoutEntry;
use App\Entity\WorkoutSession;
use App\Entity\WorkoutSet;
use App\Repository\ExerciseRepository;
use App\Repository\WorkoutSessionRepository;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

#[AllowMockObjectsWithoutExpectations]
final class BackupServiceTest extends TestCase
{
    private ExerciseRepository&MockObject $exerciseRepository;
    private WorkoutSessionRepository&MockObject $workoutSessionRepository;
    private EntityManagerInterface&MockObject $entityManager;
    private BackupService $service;

    protected function setUp(): void
    {
        $this->exerciseRepository = $this->createMock(ExerciseRepository::class);
        $this->workoutSessionRepository = $this->createMock(WorkoutSessionRepository::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->service = new BackupService($this->exerciseRepository, $this->workoutSessionRepository, $this->entityManager);
    }

    public function testExportReturnsVersionedBackupWithExercisesAndSessions(): void
    {
        $exercise = new Exercise('Bench press', ExerciseType::Strength);
        $exercise->setMuscleGroups(['Chest'])->setNotes('Heavy');
        $this->setId($exercise, 3);

        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-20'), 'Push');
        $this->setId($session, 7);
        $entry = new WorkoutEntry($session, $exercise, 1);
        $this->setId($entry, 11);
        $set = new WorkoutSet($entry, 1);
        $set->setWeightKg(80.0)->setReps(5)->setNotes('Top');
        $entry->addWorkoutSet($set);
        $session->addWorkoutEntry($entry);

        $this->exerciseRepository->method('findAll')->willReturn([$exercise]);
        $this->workoutSessionRepository->method('findAllOrdered')->willReturn([$session]);

        $backup = $this->service->export();

        self::assertSame(1, $backup['schemaVersion']);
        self::assertSame('gym-tracker', $backup['app']);
        self::assertSame(3, $backup['exercises'][0]['sourceId']);
        self::assertSame('Bench press', $backup['exercises'][0]['name']);
        self::assertSame(7, $backup['workoutSessions'][0]['sourceId']);
        self::assertSame(3, $backup['workoutSessions'][0]['entries'][0]['exerciseSourceId']);
        self::assertSame(80.0, $backup['workoutSessions'][0]['entries'][0]['sets'][0]['weightKg']);
    }

    public function testImportMergesExercisesAndCreatesSessions(): void
    {
        $existingExercise = new Exercise('Bench press', ExerciseType::Strength);
        $this->setId($existingExercise, 10);
        $createdSession = null;

        $this->exerciseRepository->method('findAll')->willReturn([$existingExercise], [$existingExercise]);
        $this->workoutSessionRepository->method('findAllOrdered')->willReturn([]);
        $this->entityManager
            ->method('wrapInTransaction')
            ->willReturnCallback(static fn (callable $callback): array => $callback());
        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (WorkoutSession $session) use (&$createdSession): bool {
                $createdSession = $session;

                return $session->getName() === 'Push' && $session->getSessionDate()->format('Y-m-d') === '2026-05-20';
            }));

        $summary = $this->service->import($this->validBackup());

        self::assertSame([
            'exercisesCreated' => 0,
            'exercisesMatched' => 1,
            'sessionsCreated' => 1,
            'sessionsSkipped' => 0,
        ], $summary);
        self::assertInstanceOf(WorkoutSession::class, $createdSession);
        self::assertCount(1, $createdSession->getWorkoutEntries());
    }

    public function testImportSkipsDuplicateSessions(): void
    {
        $exercise = new Exercise('Bench press', ExerciseType::Strength);
        $this->setId($exercise, 10);
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-20'), 'Push');
        $entry = new WorkoutEntry($session, $exercise, 1);
        $entry->addWorkoutSet((new WorkoutSet($entry, 1))->setWeightKg(80.0)->setReps(5));
        $session->addWorkoutEntry($entry);

        $this->exerciseRepository->method('findAll')->willReturn([$exercise], [$exercise]);
        $this->workoutSessionRepository->method('findAllOrdered')->willReturn([$session]);
        $this->entityManager
            ->method('wrapInTransaction')
            ->willReturnCallback(static fn (callable $callback): array => $callback());
        $this->entityManager->expects($this->never())->method('persist');

        $summary = $this->service->import($this->validBackup());

        self::assertSame(0, $summary['sessionsCreated']);
        self::assertSame(1, $summary['sessionsSkipped']);
    }

    public function testImportRejectsInvalidSchema(): void
    {
        $this->expectException(BackupValidationException::class);

        $this->service->import(['schemaVersion' => 99, 'app' => 'gym-tracker', 'exercises' => [], 'workoutSessions' => []]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validBackup(): array
    {
        return [
            'schemaVersion' => 1,
            'app' => 'gym-tracker',
            'exportedAt' => '2026-06-03T10:00:00+00:00',
            'exercises' => [[
                'sourceId' => 3,
                'name' => 'Bench press',
                'type' => 'strength',
                'muscleGroups' => ['Chest'],
                'notes' => null,
                'isActive' => true,
            ]],
            'workoutSessions' => [[
                'sourceId' => 7,
                'name' => 'Push',
                'sessionDate' => '2026-05-20',
                'mood' => null,
                'notes' => null,
                'startedAt' => null,
                'finishedAt' => null,
                'entries' => [[
                    'sourceId' => 11,
                    'exerciseSourceId' => 3,
                    'orderIndex' => 1,
                    'notes' => null,
                    'sets' => [[
                        'setNumber' => 1,
                        'weightKg' => 80.0,
                        'reps' => 5,
                        'durationSeconds' => null,
                        'distanceMeters' => null,
                        'speedKmh' => null,
                        'incline' => null,
                        'resistanceLevel' => null,
                        'calories' => null,
                        'notes' => null,
                    ]],
                ]],
            ]],
        ];
    }

    private function setId(object $entity, int $id): void
    {
        $property = new \ReflectionProperty($entity, 'id');
        $property->setValue($entity, $id);
    }
}
