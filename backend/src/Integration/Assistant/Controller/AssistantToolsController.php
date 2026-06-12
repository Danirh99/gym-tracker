<?php

declare(strict_types=1);

namespace App\Integration\Assistant\Controller;

use App\Integration\Assistant\Exception\AssistantToolException;
use App\Integration\Assistant\Security\AssistantToolGuard;
use App\Integration\Assistant\Service\AssistantExerciseToolService;
use App\Integration\Assistant\Service\AssistantWorkoutToolService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/assistant/tools')]
final class AssistantToolsController extends AbstractController
{
    public function __construct(
        private readonly AssistantToolGuard $guard,
        private readonly AssistantExerciseToolService $exerciseTools,
        private readonly AssistantWorkoutToolService $workoutTools,
    ) {
    }

    #[Route('/list-exercises', name: 'api_assistant_tools_list_exercises', methods: ['POST'])]
    public function listExercises(Request $request): JsonResponse
    {
        return $this->handle($request, fn (array $payload): array => $this->exerciseTools->listExercises($payload));
    }

    #[Route('/create-exercise', name: 'api_assistant_tools_create_exercise', methods: ['POST'])]
    public function createExercise(Request $request): JsonResponse
    {
        return $this->handle($request, fn (array $payload): array => $this->exerciseTools->createExercise($payload));
    }

    #[Route('/get-exercise-progress', name: 'api_assistant_tools_get_exercise_progress', methods: ['POST'])]
    public function getExerciseProgress(Request $request): JsonResponse
    {
        return $this->handle($request, fn (array $payload): array => $this->exerciseTools->getExerciseProgress($payload));
    }

    #[Route('/list-recent-sessions', name: 'api_assistant_tools_list_recent_sessions', methods: ['POST'])]
    public function listRecentSessions(Request $request): JsonResponse
    {
        return $this->handle($request, fn (array $payload): array => $this->workoutTools->listRecentSessions($payload));
    }

    #[Route('/get-session', name: 'api_assistant_tools_get_session', methods: ['POST'])]
    public function getSession(Request $request): JsonResponse
    {
        return $this->handle($request, fn (array $payload): array => $this->workoutTools->getSession($payload));
    }

    #[Route('/create-workout-session', name: 'api_assistant_tools_create_workout_session', methods: ['POST'])]
    public function createWorkoutSession(Request $request): JsonResponse
    {
        return $this->handle($request, fn (array $payload): array => $this->workoutTools->createWorkoutSession($payload));
    }

    #[Route('/add-strength-entry', name: 'api_assistant_tools_add_strength_entry', methods: ['POST'])]
    public function addStrengthEntry(Request $request): JsonResponse
    {
        return $this->handle($request, fn (array $payload): array => $this->workoutTools->addStrengthEntry($payload));
    }

    #[Route('/add-cardio-entry', name: 'api_assistant_tools_add_cardio_entry', methods: ['POST'])]
    public function addCardioEntry(Request $request): JsonResponse
    {
        return $this->handle($request, fn (array $payload): array => $this->workoutTools->addCardioEntry($payload));
    }

    #[Route('/add-core-entry', name: 'api_assistant_tools_add_core_entry', methods: ['POST'])]
    public function addCoreEntry(Request $request): JsonResponse
    {
        return $this->handle($request, fn (array $payload): array => $this->workoutTools->addCoreEntry($payload));
    }

    #[Route('/add-other-entry', name: 'api_assistant_tools_add_other_entry', methods: ['POST'])]
    public function addOtherEntry(Request $request): JsonResponse
    {
        return $this->handle($request, fn (array $payload): array => $this->workoutTools->addOtherEntry($payload));
    }

    /**
     * @param callable(array<string, mixed>): array<string, mixed> $tool
     */
    private function handle(Request $request, callable $tool): JsonResponse
    {
        if (!$this->guard->hasConfiguredToken()) {
            return $this->json(['message' => 'El token de assistant tools no está configurado.'], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        if (!$this->guard->isAuthorized($request)) {
            return $this->json(['message' => 'No autorizado.'], Response::HTTP_UNAUTHORIZED);
        }

        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(['message' => 'El cuerpo de la petición no es válido.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            return $this->json($tool($payload));
        } catch (AssistantToolException $exception) {
            $body = ['message' => $exception->getMessage()];
            if ($exception->errors() !== null) {
                $body['errors'] = $exception->errors();
            }

            return $this->json($body, $exception->statusCode());
        }
    }
}
