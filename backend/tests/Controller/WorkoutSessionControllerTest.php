<?php

namespace App\Tests\Controller;

use App\Controller\WorkoutSessionController;
use App\Entity\Exercise;
use App\Entity\ExerciseType;
use App\Entity\WorkoutEntry;
use App\Entity\WorkoutSession;
use App\Entity\WorkoutSet;
use App\Repository\ExerciseRepository;
use App\Repository\WorkoutEntryRepository;
use App\Repository\WorkoutSessionRepository;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

#[AllowMockObjectsWithoutExpectations]
final class WorkoutSessionControllerTest extends TestCase
{
    private WorkoutSessionRepository&MockObject $workoutSessionRepository;
    private WorkoutEntryRepository&MockObject $workoutEntryRepository;
    private ExerciseRepository&MockObject $exerciseRepository;
    private EntityManagerInterface&MockObject $entityManager;
    private WorkoutSessionController $controller;

    protected function setUp(): void
    {
        $this->workoutSessionRepository = $this->createMock(WorkoutSessionRepository::class);
        $this->workoutEntryRepository = $this->createMock(WorkoutEntryRepository::class);
        $this->exerciseRepository = $this->createMock(ExerciseRepository::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);

        $this->controller = new WorkoutSessionController(
            $this->workoutSessionRepository,
            $this->workoutEntryRepository,
            $this->exerciseRepository,
            $this->entityManager,
        );
        $this->controller->setContainer(new Container());
    }

    public function testIndexReturnsRecentSessionsWhenMonthFilterIsMissing(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-26'), 'Push day');
        $this->setId($session, 10);

        $this->workoutSessionRepository
            ->expects($this->once())
            ->method('findRecent')
            ->with(2)
            ->willReturn([$session]);
        $this->workoutSessionRepository->expects($this->never())->method('findByMonth');

        $response = $this->controller->index(new Request(['limit' => '2']));

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertCount(1, $this->decode($response)['items']);
    }

    public function testIndexReturnsSessionsByMonthWhenFilterIsProvided(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-22'), 'Pecho + cardio');
        $this->setId($session, 11);

        $this->workoutSessionRepository->expects($this->never())->method('findRecent');
        $this->workoutSessionRepository
            ->expects($this->once())
            ->method('findByMonth')
            ->with(
                $this->callback(fn (\DateTimeImmutable $date): bool => $date->format('Y-m-d') === '2026-05-01'),
                $this->callback(fn (\DateTimeImmutable $date): bool => $date->format('Y-m-d') === '2026-05-31'),
            )
            ->willReturn([$session]);

        $response = $this->controller->index(new Request(['year' => '2026', 'month' => '5']));

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame('2026-05-22', $this->decode($response)['items'][0]['sessionDate']);
    }

    public function testIndexReturnsAllSessionsWhenAllFilterIsProvided(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-04-10'), 'Full body');
        $this->setId($session, 12);

        $this->workoutSessionRepository->expects($this->never())->method('findRecent');
        $this->workoutSessionRepository->expects($this->never())->method('findByMonth');
        $this->workoutSessionRepository
            ->expects($this->once())
            ->method('findAllOrdered')
            ->willReturn([$session]);

        $response = $this->controller->index(new Request(['all' => '1']));

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame('2026-04-10', $this->decode($response)['items'][0]['sessionDate']);
    }

    public function testCreateReturnsBadRequestWhenBodyIsNotJsonObject(): void
    {
        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $response = $this->controller->create(new Request([], [], [], [], [], [], '{invalid'));

        self::assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
        self::assertSame(['message' => 'El cuerpo de la petición no es válido.'], $this->decode($response));
    }

    public function testCreateReturnsBadRequestWhenJsonIsNotAnObject(): void
    {
        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $response = $this->controller->create(new Request([], [], [], [], [], [], 'null'));

        self::assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
        self::assertSame(['message' => 'El cuerpo de la petición no es válido.'], $this->decode($response));
    }

    public function testCreateReturnsValidationErrors(): void
    {
        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $response = $this->controller->create($this->jsonRequest([
            'sessionDate' => '2026-02-30',
            'name' => 123,
            'mood' => 'excelente',
            'notes' => ['invalid'],
        ]));

        self::assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());
        self::assertSame([
            'message' => 'Hay errores de validación.',
            'errors' => [
                'sessionDate' => 'La fecha de la sesión no es válida.',
                'name' => 'El nombre no es válido.',
                'mood' => 'La sensación general no es válida.',
                'notes' => 'Las notas no son válidas.',
            ],
        ], $this->decode($response));
    }

    public function testCreateReturnsValidationErrorWhenNameIsTooLong(): void
    {
        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $response = $this->controller->create($this->jsonRequest([
            'sessionDate' => '2026-05-26',
            'name' => str_repeat('a', 121),
        ]));

        self::assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());
        self::assertSame([
            'message' => 'Hay errores de validación.',
            'errors' => ['name' => 'El nombre no puede superar los 120 caracteres.'],
        ], $this->decode($response));
    }

    public function testCreatePersistsNormalizedWorkoutSession(): void
    {
        $persistedSession = null;

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (WorkoutSession $session) use (&$persistedSession): bool {
                $persistedSession = $session;

                return $session->getSessionDate()->format('Y-m-d') === '2026-05-26'
                    && $session->getName() === 'Push day'
                    && $session->getMood() === 'muy_buena'
                    && $session->getNotes() === 'Good energy';
            }));
        $this->entityManager->expects($this->once())->method('flush');

        $response = $this->controller->create($this->jsonRequest([
            'sessionDate' => '2026-05-26',
            'name' => ' Push day ',
            'mood' => 'muy_buena',
            'notes' => ' Good energy ',
        ]));

        self::assertInstanceOf(WorkoutSession::class, $persistedSession);
        self::assertSame(Response::HTTP_CREATED, $response->getStatusCode());
        self::assertSame([
            'item' => [
                'id' => null,
                'name' => 'Push day',
                'displayName' => 'Push day',
                'sessionDate' => '2026-05-26',
                'mood' => 'muy_buena',
                'moodLabel' => 'Muy buena',
                'notes' => 'Good energy',
                'startedAt' => null,
                'finishedAt' => null,
                'exerciseCount' => 0,
                'setCount' => 0,
                'totalVolumeKg' => 0,
                'cardioDurationSeconds' => 0,
                'entries' => [],
            ],
        ], $this->decode($response));
    }

    public function testCreateNormalizesBlankOptionalStringsToNull(): void
    {
        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (WorkoutSession $session): bool {
                return $session->getName() === null
                    && $session->getMood() === null
                    && $session->getNotes() === null;
            }));
        $this->entityManager->expects($this->once())->method('flush');

        $response = $this->controller->create($this->jsonRequest([
            'sessionDate' => '2026-05-26',
            'name' => ' ',
            'notes' => ' ',
        ]));

        self::assertSame(Response::HTTP_CREATED, $response->getStatusCode());
        self::assertSame('Entrenamiento', $this->decode($response)['item']['displayName']);
    }

    public function testShowReturnsNotFoundWhenSessionDoesNotExist(): void
    {
        $this->workoutSessionRepository
            ->expects($this->once())
            ->method('find')
            ->with(99)
            ->willReturn(null);

        $response = $this->controller->show(99);

        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        self::assertSame(['message' => 'Sesión no encontrada.'], $this->decode($response));
    }

    public function testShowReturnsWorkoutSessionWithoutEntries(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-26'), 'Leg day');
        $this->setId($session, 5);
        $session
            ->setMood('buena')
            ->setNotes('Solid work')
            ->setStartedAt(new \DateTimeImmutable('2026-05-26T10:00:00+00:00'))
            ->setFinishedAt(new \DateTimeImmutable('2026-05-26T11:15:00+00:00'));

        $this->workoutSessionRepository->method('find')->with(5)->willReturn($session);

        $response = $this->controller->show(5);

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame([
            'item' => [
                'id' => 5,
                'name' => 'Leg day',
                'displayName' => 'Leg day',
                'sessionDate' => '2026-05-26',
                'mood' => 'buena',
                'moodLabel' => 'Buena',
                'notes' => 'Solid work',
                'startedAt' => '2026-05-26T10:00:00+00:00',
                'finishedAt' => '2026-05-26T11:15:00+00:00',
                'exerciseCount' => 0,
                'setCount' => 0,
                'totalVolumeKg' => 0,
                'cardioDurationSeconds' => 0,
                'entries' => [],
            ],
        ], $this->decode($response));
    }

    public function testShowSerializesEntriesSetsAndAggregates(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-26'), null);
        $this->setId($session, 7);

        $run = new Exercise('Run', ExerciseType::Cardio);
        $squat = new Exercise('Squat', ExerciseType::Strength);
        $this->setId($run, 1);
        $this->setId($squat, 2);

        $secondEntry = new WorkoutEntry($session, $squat, 2);
        $this->setId($secondEntry, 22);
        $secondEntry->setNotes('Heavy sets');
        $secondEntry->addWorkoutSet($this->workoutSet($secondEntry, 2, static function (WorkoutSet $set): void {
            $set->setWeightKg(100.0)->setReps(5)->setNotes('Top set');
        }));
        $secondEntry->addWorkoutSet($this->workoutSet($secondEntry, 1, static function (WorkoutSet $set): void {
            $set->setWeightKg(80.0)->setReps(8);
        }));

        $firstEntry = new WorkoutEntry($session, $run, 1);
        $this->setId($firstEntry, 11);
        $firstEntry->addWorkoutSet($this->workoutSet($firstEntry, 1, static function (WorkoutSet $set): void {
            $set
                ->setDurationSeconds(900)
                ->setDistanceMeters(2500.0)
                ->setSpeedKmh(10.0)
                ->setIncline(1.5)
                ->setResistanceLevel(4)
                ->setCalories(180)
                ->setNotes('Warm up');
        }));

        $session->addWorkoutEntry($secondEntry);
        $session->addWorkoutEntry($firstEntry);

        $this->workoutSessionRepository->method('find')->with(7)->willReturn($session);

        $response = $this->controller->show(7);

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame([
            'item' => [
                'id' => 7,
                'name' => null,
                'displayName' => 'Entrenamiento',
                'sessionDate' => '2026-05-26',
                'mood' => null,
                'moodLabel' => null,
                'notes' => null,
                'startedAt' => null,
                'finishedAt' => null,
                'exerciseCount' => 2,
                'setCount' => 3,
                'totalVolumeKg' => 1140,
                'cardioDurationSeconds' => 900,
                'entries' => [
                    [
                        'id' => 11,
                        'exerciseId' => 1,
                        'exerciseName' => 'Run',
                        'type' => 'cardio',
                        'typeLabel' => 'Cardio',
                        'notes' => null,
                        'sets' => [[
                            'setNumber' => 1,
                            'weightKg' => null,
                            'reps' => null,
                            'durationSeconds' => 900,
                            'distanceMeters' => 2500,
                            'speedKmh' => 10,
                            'incline' => 1.5,
                            'resistanceLevel' => 4,
                            'calories' => 180,
                            'notes' => 'Warm up',
                        ]],
                    ],
                    [
                        'id' => 22,
                        'exerciseId' => 2,
                        'exerciseName' => 'Squat',
                        'type' => 'strength',
                        'typeLabel' => 'Fuerza',
                        'notes' => 'Heavy sets',
                        'sets' => [
                            [
                                'setNumber' => 1,
                                'weightKg' => 80,
                                'reps' => 8,
                                'durationSeconds' => null,
                                'distanceMeters' => null,
                                'speedKmh' => null,
                                'incline' => null,
                                'resistanceLevel' => null,
                                'calories' => null,
                                'notes' => null,
                            ],
                            [
                                'setNumber' => 2,
                                'weightKg' => 100,
                                'reps' => 5,
                                'durationSeconds' => null,
                                'distanceMeters' => null,
                                'speedKmh' => null,
                                'incline' => null,
                                'resistanceLevel' => null,
                                'calories' => null,
                                'notes' => 'Top set',
                            ],
                        ],
                    ],
                ],
            ],
        ], $this->decode($response));
    }

    private function workoutSet(WorkoutEntry $entry, int $setNumber, callable $configure): WorkoutSet
    {
        $set = new WorkoutSet($entry, $setNumber);
        $configure($set);

        return $set;
    }

    public function testUpdateEntryReturnsNotFoundWhenSessionDoesNotExist(): void
    {
        $this->workoutSessionRepository->method('find')->with(99)->willReturn(null);

        $response = $this->controller->updateEntry(99, 1, $this->jsonRequest([
            'exerciseId' => 5,
            'notes' => null,
            'sets' => [['setNumber' => 1, 'weightKg' => 40, 'reps' => 12]],
        ]));

        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        self::assertSame(['message' => 'Sesión no encontrada.'], $this->decode($response));
    }

    public function testUpdateEntryReturnsNotFoundWhenEntryDoesNotBelongToSession(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-26'), 'Leg day');
        $this->setId($session, 5);

        $foreignSession = new WorkoutSession(new \DateTimeImmutable('2026-05-20'), null);
        $this->setId($foreignSession, 9);
        $foreignEntry = new WorkoutEntry($foreignSession, new Exercise('Squat', \App\Entity\ExerciseType::Strength), 1);
        $this->setId($foreignEntry, 11);

        $this->workoutSessionRepository->method('find')->with(5)->willReturn($session);
        $this->workoutEntryRepository->method('find')->with(11)->willReturn($foreignEntry);

        $response = $this->controller->updateEntry(5, 11, $this->jsonRequest([
            'exerciseId' => 1,
            'notes' => null,
            'sets' => [['setNumber' => 1, 'weightKg' => 40, 'reps' => 12]],
        ]));

        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        self::assertSame(['message' => 'Ejercicio de sesión no encontrado.'], $this->decode($response));
    }

    public function testUpdateEntryReturnsBadRequestWhenBodyIsNotJsonObject(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-26'), 'Leg day');
        $this->setId($session, 5);

        $squat = new Exercise('Squat', \App\Entity\ExerciseType::Strength);
        $this->setId($squat, 7);

        $entry = new WorkoutEntry($session, $squat, 1);
        $this->setId($entry, 11);
        $entry->addWorkoutSet($this->workoutSet($entry, 1, static fn (WorkoutSet $set) => $set->setWeightKg(40.0)->setReps(12)));

        $this->workoutSessionRepository->method('find')->with(5)->willReturn($session);
        $this->workoutEntryRepository->method('find')->with(11)->willReturn($entry);
        $this->exerciseRepository->method('find')->with(7)->willReturn($squat);

        $response = $this->controller->updateEntry(5, 11, new Request([], [], [], [], [], ['CONTENT_TYPE' => 'application/json'], '{invalid'));

        self::assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
        self::assertSame(['message' => 'El cuerpo de la petición no es válido.'], $this->decode($response));
    }

    public function testUpdateEntryReturnsNotFoundWhenExerciseDoesNotMatchEntry(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-26'), 'Leg day');
        $this->setId($session, 5);

        $squat = new Exercise('Squat', \App\Entity\ExerciseType::Strength);
        $this->setId($squat, 7);

        $otherExercise = new Exercise('Deadlift', \App\Entity\ExerciseType::Strength);
        $this->setId($otherExercise, 99);

        $entry = new WorkoutEntry($session, $squat, 1);
        $this->setId($entry, 11);

        $this->workoutSessionRepository->method('find')->with(5)->willReturn($session);
        $this->workoutEntryRepository->method('find')->with(11)->willReturn($entry);
        $this->exerciseRepository->method('find')->with(99)->willReturn($otherExercise);

        $response = $this->controller->updateEntry(5, 11, $this->jsonRequest([
            'exerciseId' => 99,
            'notes' => 'Updated',
            'sets' => [['setNumber' => 1, 'weightKg' => 40, 'reps' => 12]],
        ]));

        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        self::assertSame(['message' => 'Ejercicio no encontrado.'], $this->decode($response));
    }

    public function testUpdateEntryReturnsValidationErrorsWhenSetsAreEmpty(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-26'), 'Leg day');
        $this->setId($session, 5);

        $squat = new Exercise('Squat', \App\Entity\ExerciseType::Strength);
        $this->setId($squat, 7);

        $entry = new WorkoutEntry($session, $squat, 1);
        $this->setId($entry, 11);

        $this->workoutSessionRepository->method('find')->with(5)->willReturn($session);
        $this->workoutEntryRepository->method('find')->with(11)->willReturn($entry);
        $this->exerciseRepository->method('find')->with(7)->willReturn($squat);

        $response = $this->controller->updateEntry(5, 11, $this->jsonRequest([
            'exerciseId' => 7,
            'notes' => null,
            'sets' => [],
        ]));

        self::assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());
        self::assertSame([
            'message' => 'Hay errores de validación.',
            'errors' => ['sets' => 'Debes añadir al menos una serie.'],
        ], $this->decode($response));
    }

    public function testUpdateEntryReplacesSetsAndUpdatesNotes(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-26'), 'Leg day');
        $this->setId($session, 5);

        $squat = new Exercise('Squat', \App\Entity\ExerciseType::Strength);
        $this->setId($squat, 7);

        $entry = new WorkoutEntry($session, $squat, 1);
        $this->setId($entry, 11);
        $entry->setNotes('Old notes');
        $entry->addWorkoutSet($this->workoutSet($entry, 1, static fn (WorkoutSet $set) => $set->setWeightKg(40.0)->setReps(12)));
        $entry->addWorkoutSet($this->workoutSet($entry, 2, static fn (WorkoutSet $set) => $set->setWeightKg(45.0)->setReps(10)));
        $session->addWorkoutEntry($entry);

        $this->workoutSessionRepository->method('find')->with(5)->willReturn($session);
        $this->workoutEntryRepository->method('find')->with(11)->willReturn($entry);
        $this->exerciseRepository->method('find')->with(7)->willReturn($squat);

        $this->entityManager->expects($this->once())->method('flush');

        $response = $this->controller->updateEntry(5, 11, $this->jsonRequest([
            'exerciseId' => 7,
            'notes' => 'New notes',
            'sets' => [
                ['setNumber' => 1, 'weightKg' => 50, 'reps' => 8, 'notes' => 'Top set'],
                ['setNumber' => 2, 'weightKg' => 45, 'reps' => 10],
            ],
        ]));

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());

        $serializedEntry = $this->decode($response)['item']['entries'][0];
        self::assertSame('New notes', $serializedEntry['notes']);
        self::assertCount(2, $serializedEntry['sets']);
        self::assertEquals(50.0, $serializedEntry['sets'][0]['weightKg']);
        self::assertSame(8, $serializedEntry['sets'][0]['reps']);
        self::assertSame('Top set', $serializedEntry['sets'][0]['notes']);
        self::assertEquals(45.0, $serializedEntry['sets'][1]['weightKg']);
        self::assertSame(10, $serializedEntry['sets'][1]['reps']);
    }

    public function testUpdateEntryNormalizesBlankNotesToNull(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-26'), 'Leg day');
        $this->setId($session, 5);

        $squat = new Exercise('Squat', \App\Entity\ExerciseType::Strength);
        $this->setId($squat, 7);

        $entry = new WorkoutEntry($session, $squat, 1);
        $this->setId($entry, 11);
        $entry->setNotes('Old notes');
        $entry->addWorkoutSet($this->workoutSet($entry, 1, static fn (WorkoutSet $set) => $set->setWeightKg(40.0)->setReps(12)));
        $session->addWorkoutEntry($entry);

        $this->workoutSessionRepository->method('find')->with(5)->willReturn($session);
        $this->workoutEntryRepository->method('find')->with(11)->willReturn($entry);
        $this->exerciseRepository->method('find')->with(7)->willReturn($squat);

        $response = $this->controller->updateEntry(5, 11, $this->jsonRequest([
            'exerciseId' => 7,
            'notes' => '   ',
            'sets' => [['setNumber' => 1, 'weightKg' => 40, 'reps' => 12]],
        ]));

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertNull($this->decode($response)['item']['entries'][0]['notes']);
    }

    private function jsonRequest(array $payload): Request
    {
        return new Request([], [], [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode($payload, JSON_THROW_ON_ERROR));
    }

    private function decode(Response $response): array
    {
        return json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    private function setId(object $entity, int $id): void
    {
        $property = new \ReflectionProperty($entity, 'id');
        $property->setValue($entity, $id);
    }
}
