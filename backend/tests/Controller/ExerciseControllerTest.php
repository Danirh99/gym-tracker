<?php

namespace App\Tests\Controller;

use App\Controller\ExerciseController;
use App\Entity\Exercise;
use App\Entity\ExerciseType;
use App\Entity\WorkoutEntry;
use App\Entity\WorkoutSession;
use App\Entity\WorkoutSet;
use App\Repository\ExerciseRepository;
use App\Repository\WorkoutEntryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Query;
use Doctrine\ORM\QueryBuilder;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

#[AllowMockObjectsWithoutExpectations]
final class ExerciseControllerTest extends TestCase
{
    private ExerciseRepository&MockObject $exerciseRepository;
    private WorkoutEntryRepository&MockObject $workoutEntryRepository;
    private EntityManagerInterface&MockObject $entityManager;
    private ExerciseController $controller;

    protected function setUp(): void
    {
        $this->exerciseRepository = $this->createMock(ExerciseRepository::class);
        $this->workoutEntryRepository = $this->createMock(WorkoutEntryRepository::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);

        $this->controller = new ExerciseController(
            $this->exerciseRepository,
            $this->workoutEntryRepository,
            $this->entityManager,
        );
        $this->controller->setContainer(new Container());
    }

    public function testIndexReturnsActiveExercises(): void
    {
        $exercise = $this->exercise('Bench Press', ExerciseType::Strength, ['Chest'], 'Heavy day');
        $this->setId($exercise, 12);

        $this->exerciseRepository
            ->expects($this->once())
            ->method('findActiveOrderedByName')
            ->willReturn([$exercise]);
        $this->mockLastPerformance(null);

        $response = $this->controller->index();

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame([
            'items' => [[
                'id' => 12,
                'name' => 'Bench Press',
                'type' => 'strength',
                'typeLabel' => 'Fuerza',
                'muscleGroups' => ['Chest'],
                'notes' => 'Heavy day',
                'icon' => 'fitness_center',
                'lastPerformance' => null,
            ]],
        ], $this->decode($response));
    }

    public function testCreateReturnsBadRequestWhenBodyIsNotJsonObject(): void
    {
        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $response = $this->controller->create(new Request([], [], [], [], [], [], '{invalid'));

        self::assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
        self::assertSame(['message' => 'El cuerpo de la petición no es válido.'], $this->decode($response));
    }

    public function testCreateReturnsValidationErrors(): void
    {
        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $response = $this->controller->create($this->jsonRequest([
            'name' => ' ',
            'type' => 'unknown',
            'muscleGroups' => 'Chest',
            'notes' => 123,
        ]));

        self::assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());
        self::assertSame([
            'message' => 'Hay errores de validación.',
            'errors' => [
                'name' => 'El nombre es obligatorio.',
                'type' => 'El tipo de ejercicio no es válido.',
                'muscleGroups' => 'Los músculos trabajados no son válidos.',
                'notes' => 'Las notas no son válidas.',
            ],
        ], $this->decode($response));
    }

    public function testCreatePersistsNormalizedExercise(): void
    {
        $persistedExercise = null;

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (Exercise $exercise) use (&$persistedExercise): bool {
                $persistedExercise = $exercise;

                return $exercise->getName() === 'Deadlift'
                    && $exercise->getType() === ExerciseType::Strength
                    && $exercise->getMuscleGroups() === ['Back', 'Legs']
                    && $exercise->getNotes() === null;
            }));
        $this->entityManager->expects($this->once())->method('flush');
        $this->mockLastPerformance(null);

        $response = $this->controller->create($this->jsonRequest([
            'name' => ' Deadlift ',
            'type' => 'strength',
            'muscleGroups' => [' Back ', '', 'Legs', 'Back'],
            'notes' => ' ',
        ]));

        self::assertInstanceOf(Exercise::class, $persistedExercise);
        self::assertSame(Response::HTTP_CREATED, $response->getStatusCode());
        self::assertSame([
            'item' => [
                'id' => null,
                'name' => 'Deadlift',
                'type' => 'strength',
                'typeLabel' => 'Fuerza',
                'muscleGroups' => ['Back', 'Legs'],
                'notes' => null,
                'icon' => 'fitness_center',
                'lastPerformance' => null,
            ],
        ], $this->decode($response));
    }

    public function testShowReturnsNotFoundWhenExerciseDoesNotExist(): void
    {
        $this->exerciseRepository
            ->expects($this->once())
            ->method('find')
            ->with(99)
            ->willReturn(null);
        $this->workoutEntryRepository->expects($this->never())->method('createQueryBuilder');

        $response = $this->controller->show(99);

        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        self::assertSame(['message' => 'Ejercicio no encontrado.'], $this->decode($response));
    }

    public function testShowReturnsNotFoundWhenExerciseIsInactive(): void
    {
        $exercise = $this->exercise('Inactive', ExerciseType::Other);
        $exercise->setIsActive(false);

        $this->exerciseRepository->method('find')->with(7)->willReturn($exercise);
        $this->workoutEntryRepository->expects($this->never())->method('createQueryBuilder');

        $response = $this->controller->show(7);

        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        self::assertSame(['message' => 'Ejercicio no encontrado.'], $this->decode($response));
    }

    public function testShowReturnsExercise(): void
    {
        $exercise = $this->exercise('Run', ExerciseType::Cardio, ['Legs'], 'Easy pace');
        $this->setId($exercise, 3);

        $this->exerciseRepository->method('find')->with(3)->willReturn($exercise);
        $this->mockLastPerformance($this->entryWithSet($exercise, static function (WorkoutSet $set): void {
            $set->setDurationSeconds(1800)->setDistanceMeters(5000);
        }));

        $response = $this->controller->show(3);

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame([
            'item' => [
                'id' => 3,
                'name' => 'Run',
                'type' => 'cardio',
                'typeLabel' => 'Cardio',
                'muscleGroups' => ['Legs'],
                'notes' => 'Easy pace',
                'icon' => 'directions_run',
                'lastPerformance' => '30 min · 5 km',
            ],
        ], $this->decode($response));
    }

    public function testProgressReturnsNotFoundWhenExerciseDoesNotExist(): void
    {
        $this->exerciseRepository
            ->expects($this->once())
            ->method('find')
            ->with(55)
            ->willReturn(null);
        $this->workoutEntryRepository->expects($this->never())->method('createQueryBuilder');

        $response = $this->controller->progress(55);

        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        self::assertSame(['message' => 'Ejercicio no encontrado.'], $this->decode($response));
    }

    public function testProgressReturnsTopSetSummaryAndItems(): void
    {
        $exercise = $this->exercise('Bench Press', ExerciseType::Strength, ['Chest'], 'Heavy day');
        $this->setId($exercise, 9);

        $sessionA = new WorkoutSession(new \DateTimeImmutable('2026-05-25'));
        $this->setSessionId($sessionA, 1001);
        $entryA = new WorkoutEntry($sessionA, $exercise, 1);
        $this->setEntryId($entryA, 301);
        $entryA->addWorkoutSet((new WorkoutSet($entryA, 1))->setWeightKg(80.0)->setReps(8));
        $entryA->addWorkoutSet((new WorkoutSet($entryA, 2))->setWeightKg(82.5)->setReps(6));

        $sessionB = new WorkoutSession(new \DateTimeImmutable('2026-05-20'));
        $this->setSessionId($sessionB, 1000);
        $entryB = new WorkoutEntry($sessionB, $exercise, 1);
        $this->setEntryId($entryB, 300);
        $entryB->addWorkoutSet((new WorkoutSet($entryB, 1))->setWeightKg(75.0)->setReps(10));

        $this->exerciseRepository->method('find')->with(9)->willReturn($exercise);
        $this->mockProgressEntries([$entryA, $entryB]);

        $response = $this->controller->progress(9);
        $payload = $this->decode($response);

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame('Bench Press', $payload['item']['name']);
        self::assertSame(2, $payload['summary']['sessions']);
        self::assertSame('82.5 kg x 6 reps', $payload['summary']['bestTopSet']);
        self::assertSame('82.5 kg x 6 reps', $payload['summary']['lastTopSet']);
        self::assertSame(1885, $payload['summary']['totalVolumeKg']);
        self::assertCount(2, $payload['items']);
        self::assertSame('2026-05-25', $payload['items'][0]['sessionDate']);
        self::assertSame('82.5 kg x 6 reps', $payload['items'][0]['topSet']);
        self::assertSame(82.5, $payload['items'][0]['topSetWeightKg']);
        self::assertSame(6, $payload['items'][0]['topSetReps']);
    }

    public function testUpdateReturnsNotFoundWhenExerciseDoesNotExist(): void
    {
        $this->exerciseRepository->method('find')->with(1)->willReturn(null);
        $this->entityManager->expects($this->never())->method('flush');

        $response = $this->controller->update(1, $this->jsonRequest(['name' => 'Squat', 'type' => 'strength']));

        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        self::assertSame(['message' => 'Ejercicio no encontrado.'], $this->decode($response));
    }

    public function testUpdateReturnsBadRequestWhenBodyIsNotJsonObject(): void
    {
        $exercise = $this->exercise('Squat', ExerciseType::Strength);

        $this->exerciseRepository->method('find')->with(1)->willReturn($exercise);
        $this->entityManager->expects($this->never())->method('flush');

        $response = $this->controller->update(1, new Request([], [], [], [], [], [], 'null'));

        self::assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
        self::assertSame(['message' => 'El cuerpo de la petición no es válido.'], $this->decode($response));
    }

    public function testUpdateReturnsValidationErrors(): void
    {
        $exercise = $this->exercise('Squat', ExerciseType::Strength);

        $this->exerciseRepository->method('find')->with(1)->willReturn($exercise);
        $this->entityManager->expects($this->never())->method('flush');

        $response = $this->controller->update(1, $this->jsonRequest(['name' => str_repeat('a', 121), 'type' => 'strength']));

        self::assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());
        self::assertSame([
            'message' => 'Hay errores de validación.',
            'errors' => ['name' => 'El nombre no puede superar los 120 caracteres.'],
        ], $this->decode($response));
    }

    public function testUpdateChangesExerciseAndFlushes(): void
    {
        $exercise = $this->exercise('Squat', ExerciseType::Strength, ['Legs'], 'Old note');

        $this->exerciseRepository->method('find')->with(1)->willReturn($exercise);
        $this->entityManager->expects($this->once())->method('flush');
        $this->mockLastPerformance(null);

        $response = $this->controller->update(1, $this->jsonRequest([
            'name' => ' Plank ',
            'type' => 'core',
            'muscleGroups' => [' Core ', 'Core', 'Abs'],
            'notes' => ' Stable ',
        ]));

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame([
            'item' => [
                'id' => null,
                'name' => 'Plank',
                'type' => 'core',
                'typeLabel' => 'Abdomen',
                'muscleGroups' => ['Core', 'Abs'],
                'notes' => 'Stable',
                'icon' => 'sports_gymnastics',
                'lastPerformance' => null,
            ],
        ], $this->decode($response));
    }

    public function testDeleteReturnsNotFoundWhenExerciseDoesNotExist(): void
    {
        $this->exerciseRepository->method('find')->with(1)->willReturn(null);
        $this->entityManager->expects($this->never())->method('flush');

        $response = $this->controller->delete(1);

        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        self::assertSame(['message' => 'Ejercicio no encontrado.'], $this->decode($response));
    }

    public function testDeleteDeactivatesExerciseAndFlushes(): void
    {
        $exercise = $this->exercise('Squat', ExerciseType::Strength);

        $this->exerciseRepository->method('find')->with(1)->willReturn($exercise);
        $this->entityManager->expects($this->once())->method('flush');

        $response = $this->controller->delete(1);

        self::assertSame(Response::HTTP_NO_CONTENT, $response->getStatusCode());
        self::assertSame('', $response->getContent());
        self::assertFalse($exercise->isActive());
    }

    #[DataProvider('lastPerformanceProvider')]
    public function testLastPerformanceFormatsLastSet(?callable $setConfigurator, ?string $expected): void
    {
        $exercise = $this->exercise('Exercise', ExerciseType::Other);

        $this->exerciseRepository->method('find')->with(1)->willReturn($exercise);
        $this->mockLastPerformance($setConfigurator === null ? null : $this->entryWithSet($exercise, $setConfigurator));

        $response = $this->controller->show(1);

        self::assertSame($expected, $this->decode($response)['item']['lastPerformance']);
    }

    public static function lastPerformanceProvider(): iterable
    {
        yield 'weight and reps' => [static function (WorkoutSet $set): void {
            $set->setWeightKg(82.5)->setReps(8);
        }, '82.5 kg x 8 reps'];

        yield 'duration and distance' => [static function (WorkoutSet $set): void {
            $set->setDurationSeconds(754)->setDistanceMeters(1250);
        }, '12:34 min · 1.3 km'];

        yield 'duration only' => [static function (WorkoutSet $set): void {
            $set->setDurationSeconds(45);
        }, '45s'];

        yield 'reps only' => [static function (WorkoutSet $set): void {
            $set->setReps(20);
        }, '20 reps'];

        yield 'no entry' => [null, null];
    }

    private function exercise(string $name, ExerciseType $type, array $muscleGroups = [], ?string $notes = null): Exercise
    {
        $exercise = new Exercise($name, $type);
        $exercise->setMuscleGroups($muscleGroups);
        $exercise->setNotes($notes);

        return $exercise;
    }

    private function entryWithSet(Exercise $exercise, callable $setConfigurator): WorkoutEntry
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-05-26'));
        $entry = new WorkoutEntry($session, $exercise, 1);
        $set = new WorkoutSet($entry, 1);
        $setConfigurator($set);
        $entry->addWorkoutSet($set);

        return $entry;
    }

    private function mockLastPerformance(?WorkoutEntry $entry): void
    {
        $query = $this->createMock(Query::class);
        $query->method('getOneOrNullResult')->willReturn($entry);

        $queryBuilder = $this->createMock(QueryBuilder::class);
        $queryBuilder->method('join')->willReturnSelf();
        $queryBuilder->method('andWhere')->willReturnSelf();
        $queryBuilder->method('setParameter')->willReturnSelf();
        $queryBuilder->method('orderBy')->willReturnSelf();
        $queryBuilder->method('addOrderBy')->willReturnSelf();
        $queryBuilder->method('setMaxResults')->willReturnSelf();
        $queryBuilder->method('getQuery')->willReturn($query);

        $this->workoutEntryRepository
            ->expects($this->once())
            ->method('createQueryBuilder')
            ->with('entry')
            ->willReturn($queryBuilder);
    }

    /**
     * @param list<WorkoutEntry> $entries
     */
    private function mockProgressEntries(array $entries): void
    {
        $query = $this->createMock(Query::class);
        $query->method('getResult')->willReturn($entries);

        $queryBuilder = $this->createMock(QueryBuilder::class);
        $queryBuilder->method('join')->willReturnSelf();
        $queryBuilder->method('addSelect')->willReturnSelf();
        $queryBuilder->method('leftJoin')->willReturnSelf();
        $queryBuilder->method('andWhere')->willReturnSelf();
        $queryBuilder->method('setParameter')->willReturnSelf();
        $queryBuilder->method('orderBy')->willReturnSelf();
        $queryBuilder->method('addOrderBy')->willReturnSelf();
        $queryBuilder->method('getQuery')->willReturn($query);

        $this->workoutEntryRepository
            ->expects($this->once())
            ->method('createQueryBuilder')
            ->with('entry')
            ->willReturn($queryBuilder);
    }

    private function jsonRequest(array $payload): Request
    {
        return new Request([], [], [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode($payload, JSON_THROW_ON_ERROR));
    }

    private function decode(Response $response): array
    {
        return json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    private function setId(Exercise $exercise, int $id): void
    {
        $property = new \ReflectionProperty(Exercise::class, 'id');
        $property->setValue($exercise, $id);
    }

    private function setSessionId(WorkoutSession $session, int $id): void
    {
        $property = new \ReflectionProperty(WorkoutSession::class, 'id');
        $property->setValue($session, $id);
    }

    private function setEntryId(WorkoutEntry $entry, int $id): void
    {
        $property = new \ReflectionProperty(WorkoutEntry::class, 'id');
        $property->setValue($entry, $id);
    }
}
