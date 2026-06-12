<?php

declare(strict_types=1);

namespace App\Tests\Integration\Assistant\Controller;

use App\Application\Assembler\WorkoutSessionAssembler;
use App\Application\Factory\AddWorkoutEntryInputFactory;
use App\Application\Service\ExerciseProgressRecommendationService;
use App\Application\Service\WorkoutEntryCreator;
use App\Application\Validation\AddWorkoutEntryInputValidator;
use App\Entity\Exercise;
use App\Entity\ExerciseType;
use App\Entity\WorkoutSession;
use App\Integration\Assistant\Controller\AssistantToolsController;
use App\Integration\Assistant\Security\AssistantToolGuard;
use App\Integration\Assistant\Service\AssistantExerciseToolService;
use App\Integration\Assistant\Service\AssistantWorkoutToolService;
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
final class AssistantToolsControllerTest extends TestCase
{
    private const TOKEN = 'test-assistant-token';

    private ExerciseRepository&MockObject $exerciseRepository;
    private WorkoutEntryRepository&MockObject $workoutEntryRepository;
    private WorkoutSessionRepository&MockObject $workoutSessionRepository;
    private EntityManagerInterface&MockObject $entityManager;
    private AssistantToolsController $controller;

    protected function setUp(): void
    {
        $this->exerciseRepository = $this->createMock(ExerciseRepository::class);
        $this->workoutEntryRepository = $this->createMock(WorkoutEntryRepository::class);
        $this->workoutSessionRepository = $this->createMock(WorkoutSessionRepository::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);

        $exerciseTools = new AssistantExerciseToolService(
            $this->exerciseRepository,
            $this->workoutEntryRepository,
            $this->entityManager,
            new ExerciseProgressRecommendationService(),
        );
        $workoutTools = new AssistantWorkoutToolService(
            $this->workoutSessionRepository,
            $this->exerciseRepository,
            $this->entityManager,
            new WorkoutSessionAssembler(),
            new AddWorkoutEntryInputFactory(),
            new AddWorkoutEntryInputValidator(),
            new WorkoutEntryCreator($this->entityManager),
        );

        $this->controller = new AssistantToolsController(
            new AssistantToolGuard(self::TOKEN),
            $exerciseTools,
            $workoutTools,
        );
        $this->controller->setContainer(new Container());
    }

    public function testRejectsRequestsWithoutBearerToken(): void
    {
        $this->exerciseRepository->expects($this->never())->method('findActiveOrderedByName');

        $response = $this->controller->listExercises($this->jsonRequest([], false));

        self::assertSame(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());
        self::assertSame(['message' => 'No autorizado.'], $this->decode($response));
    }

    public function testListExercisesReturnsAssistantMessage(): void
    {
        $exercise = new Exercise('Press pecho máquina', ExerciseType::Strength);
        $this->setId($exercise, 7);

        $this->exerciseRepository
            ->expects($this->once())
            ->method('findActiveOrderedByName')
            ->willReturn([$exercise]);

        $response = $this->controller->listExercises($this->jsonRequest(['query' => 'press']));
        $data = $this->decode($response);

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame('Ejercicios encontrados: 7 - Press pecho máquina (Fuerza).', $data['message']);
        self::assertSame(7, $data['items'][0]['id']);
    }

    public function testAcceptsAssistantTokenHeader(): void
    {
        $exercise = new Exercise('Cinta', ExerciseType::Cardio);
        $this->setId($exercise, 8);

        $this->exerciseRepository
            ->expects($this->once())
            ->method('findActiveOrderedByName')
            ->willReturn([$exercise]);

        $response = $this->controller->listExercises($this->jsonRequest([], true, true));

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
    }

    public function testCreateWorkoutSessionPersistsSession(): void
    {
        $persistedSession = null;

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (WorkoutSession $session) use (&$persistedSession): bool {
                $persistedSession = $session;

                return $session->getSessionDate()->format('Y-m-d') === '2026-06-11'
                    && $session->getName() === 'Pecho'
                    && $session->getMood() === 'buena';
            }));
        $this->entityManager->expects($this->once())->method('flush');

        $response = $this->controller->createWorkoutSession($this->jsonRequest([
            'sessionDate' => '2026-06-11',
            'name' => 'Pecho',
            'mood' => 'buena',
            'notes' => null,
        ]));
        $data = $this->decode($response);

        self::assertInstanceOf(WorkoutSession::class, $persistedSession);
        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame('Pecho', $data['item']['displayName']);
    }

    public function testAddStrengthEntryReturnsValidationErrors(): void
    {
        $session = new WorkoutSession(new \DateTimeImmutable('2026-06-11'), 'Pecho');
        $exercise = new Exercise('Press pecho máquina', ExerciseType::Strength);
        $this->setId($session, 10);
        $this->setId($exercise, 5);

        $this->workoutSessionRepository->method('find')->with(10)->willReturn($session);
        $this->exerciseRepository->method('find')->with(5)->willReturn($exercise);
        $this->entityManager->expects($this->never())->method('flush');

        $response = $this->controller->addStrengthEntry($this->jsonRequest([
            'sessionId' => 10,
            'exerciseId' => 5,
            'sets' => [[]],
        ]));
        $data = $this->decode($response);

        self::assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());
        self::assertSame('Hay errores de validación.', $data['message']);
        self::assertSame('Cada serie de fuerza debe tener peso o repeticiones.', $data['errors']['sets.0']);
    }

    /** @param array<string, mixed> $payload */
    private function jsonRequest(array $payload, bool $authorized = true, bool $assistantTokenHeader = false): Request
    {
        $headers = ['CONTENT_TYPE' => 'application/json'];

        if ($authorized && $assistantTokenHeader) {
            $headers['HTTP_X_GYM_TRACKER_ASSISTANT_TOKEN'] = self::TOKEN;
        } elseif ($authorized) {
            $headers['HTTP_AUTHORIZATION'] = 'Bearer '.self::TOKEN;
        }

        return new Request([], [], [], [], [], $headers, json_encode($payload, \JSON_THROW_ON_ERROR));
    }

    /** @return array<string, mixed> */
    private function decode(Response $response): array
    {
        $content = $response->getContent();
        self::assertIsString($content);

        $decoded = json_decode($content, true);
        self::assertIsArray($decoded);

        return $decoded;
    }

    private function setId(object $entity, int $id): void
    {
        $reflection = new \ReflectionClass($entity);
        $property = $reflection->getProperty('id');
        $property->setValue($entity, $id);
    }
}
