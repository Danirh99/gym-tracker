<?php

declare(strict_types=1);

namespace App\Controller;

use App\Application\Assembler\WorkoutSessionAssembler;
use App\Application\Factory\AddWorkoutEntryInputFactory;
use App\Application\Service\WorkoutEntryCreator;
use App\Application\Service\WorkoutEntryUpdater;
use App\Application\Validation\AddWorkoutEntryInputValidator;
use App\Entity\WorkoutSession;
use App\Entity\WorkoutEntry;
use App\Repository\ExerciseRepository;
use App\Repository\WorkoutEntryRepository;
use App\Repository\WorkoutSessionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Expone la API REST para crear y consultar sesiones de entrenamiento.
 */
final class WorkoutSessionController extends AbstractController
{
    private readonly WorkoutSessionAssembler $workoutSessionAssembler;

    private readonly AddWorkoutEntryInputFactory $addWorkoutEntryInputFactory;

    private readonly AddWorkoutEntryInputValidator $addWorkoutEntryInputValidator;

    private readonly WorkoutEntryCreator $workoutEntryCreator;

    private readonly WorkoutEntryUpdater $workoutEntryUpdater;

    /**
     * Etiquetas públicas para los valores técnicos de sensación general.
     *
     * @var array<string, string>
     */
    private const MOOD_LABELS = [
        // Sensación negativa del entrenamiento.
        'mala' => 'Mala',
        // Sensación neutra del entrenamiento.
        'normal' => 'Normal',
        // Sensación positiva del entrenamiento.
        'buena' => 'Buena',
        // Sensación muy positiva del entrenamiento.
        'muy_buena' => 'Muy buena',
    ];

    /**
     * Recibe las dependencias necesarias para consultar sesiones y persistir cambios.
     */
    public function __construct(
        private readonly WorkoutSessionRepository $workoutSessionRepository,
        private readonly WorkoutEntryRepository $workoutEntryRepository,
        private readonly ExerciseRepository $exerciseRepository,
        private readonly EntityManagerInterface $entityManager,
        ?WorkoutSessionAssembler $workoutSessionAssembler = null,
        ?AddWorkoutEntryInputFactory $addWorkoutEntryInputFactory = null,
        ?AddWorkoutEntryInputValidator $addWorkoutEntryInputValidator = null,
        ?WorkoutEntryCreator $workoutEntryCreator = null,
        ?WorkoutEntryUpdater $workoutEntryUpdater = null,
    ) {
        $this->workoutSessionAssembler = $workoutSessionAssembler ?? new WorkoutSessionAssembler();
        $this->addWorkoutEntryInputFactory = $addWorkoutEntryInputFactory ?? new AddWorkoutEntryInputFactory();
        $this->addWorkoutEntryInputValidator = $addWorkoutEntryInputValidator ?? new AddWorkoutEntryInputValidator();
        $this->workoutEntryCreator = $workoutEntryCreator ?? new WorkoutEntryCreator($this->entityManager);
        $this->workoutEntryUpdater = $workoutEntryUpdater ?? new WorkoutEntryUpdater($this->entityManager);
    }

    #[Route('/api/workout-sessions', name: 'api_workout_sessions_index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $year = $request->query->getInt('year', 0);
        $month = $request->query->getInt('month', 0);
        $all = filter_var($request->query->get('all', false), \FILTER_VALIDATE_BOOL);

        if ($all) {
            $sessions = $this->workoutSessionRepository->findAllOrdered();
        } elseif ($year >= 1 && $month >= 1 && $month <= 12) {
            $from = new \DateTimeImmutable(sprintf('%04d-%02d-01', $year, $month));
            $to = $from->modify('last day of this month');
            $sessions = $this->workoutSessionRepository->findByMonth($from, $to);
        } else {
            $limit = max(1, min(10, $request->query->getInt('limit', 3)));
            $sessions = $this->workoutSessionRepository->findRecent($limit);
        }

        $items = array_map(
            fn (WorkoutSession $session): array => $this->workoutSessionAssembler->assemble($session),
            $sessions,
        );

        return $this->json(['items' => $items]);
    }

    /**
     * Crea una sesión de entrenamiento desde el JSON recibido.
     */
    #[Route('/api/workout-sessions', name: 'api_workout_sessions_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // Decodifica el cuerpo JSON como array asociativo.
        $payload = json_decode($request->getContent(), true);

        // Rechaza peticiones cuyo cuerpo no sea un objeto JSON válido.
        if (!is_array($payload)) {
            // Devuelve 400 cuando la petición no se puede interpretar.
            return $this->json(['message' => 'El cuerpo de la petición no es válido.'], Response::HTTP_BAD_REQUEST);
        }

        // Valida todos los campos antes de construir la entidad.
        $errors = $this->validatePayload($payload);

        // Detiene la creación si algún campo incumple las reglas esperadas.
        if ($errors !== []) {
            // Devuelve 422 porque el JSON es válido, pero sus datos no son procesables.
            return $this->json(['message' => 'Hay errores de validación.', 'errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Convierte la fecha validada a DateTimeImmutable.
        $sessionDate = $this->parseSessionDate($payload['sessionDate']);
        // Crea la sesión con fecha obligatoria y nombre opcional normalizado.
        $session = new WorkoutSession($sessionDate, $this->normalizeOptionalString($payload['name'] ?? null));
        // Aplica campos opcionales normalizados sobre la sesión.
        $session
            // Guarda la sensación solo si corresponde con un valor permitido.
            ->setMood($this->normalizeMood($payload['mood'] ?? null))
            // Guarda notas limpias o null si llegan vacías.
            ->setNotes($this->normalizeOptionalString($payload['notes'] ?? null));

        // Registra la sesión nueva para su inserción.
        $this->entityManager->persist($session);
        // Ejecuta la inserción y sincroniza la entidad con base de datos.
        $this->entityManager->flush();

        // Devuelve la sesión creada con código HTTP 201.
        return $this->json(['item' => $this->workoutSessionAssembler->assemble($session)], Response::HTTP_CREATED);
    }

    /**
     * Muestra una sesión de entrenamiento por identificador.
     */
    #[Route('/api/workout-sessions/{id}', name: 'api_workout_sessions_show', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        // Busca la sesión por clave primaria.
        $session = $this->workoutSessionRepository->find($id);

        // Devuelve 404 cuando no existe una sesión con ese identificador.
        if (!$session instanceof WorkoutSession) {
            // Mantiene un mensaje estable para el cliente.
            return $this->json(['message' => 'Sesión no encontrada.'], Response::HTTP_NOT_FOUND);
        }

        // Serializa la sesión encontrada en la clave estable `item`.
        return $this->json(['item' => $this->workoutSessionAssembler->assemble($session)]);
    }

    #[Route('/api/workout-sessions/{id}/entries', name: 'api_workout_sessions_add_entry', requirements: ['id' => '\\d+'], methods: ['POST'])]
    public function addEntry(int $id, Request $request): JsonResponse
    {
        $session = $this->workoutSessionRepository->find($id);

        if (!$session instanceof WorkoutSession) {
            return $this->json(['message' => 'Sesión no encontrada.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(['message' => 'El cuerpo de la petición no es válido.'], Response::HTTP_BAD_REQUEST);
        }

        $input = $this->addWorkoutEntryInputFactory->fromArray($payload);

        $exercise = $this->exerciseRepository->find($input->exerciseId);

        if ($exercise === null || !$exercise->isActive()) {
            return $this->json(['message' => 'Ejercicio no encontrado.'], Response::HTTP_NOT_FOUND);
        }

        $errors = $this->addWorkoutEntryInputValidator->validate($input, $exercise->getType());

        if ($errors !== []) {
            return $this->json(['message' => 'Hay errores de validación.', 'errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->workoutEntryCreator->create($session, $exercise, $input);

        return $this->json(['item' => $this->workoutSessionAssembler->assemble($session)], Response::HTTP_CREATED);
    }

    #[Route('/api/workout-sessions/{id}/entries/{entryId}', name: 'api_workout_sessions_delete_entry', requirements: ['id' => '\\d+', 'entryId' => '\\d+'], methods: ['DELETE'])]
    public function deleteEntry(int $id, int $entryId): JsonResponse
    {
        $session = $this->workoutSessionRepository->find($id);

        if (!$session instanceof WorkoutSession) {
            return $this->json(['message' => 'Sesión no encontrada.'], Response::HTTP_NOT_FOUND);
        }

        $entry = $this->workoutEntryRepository->find($entryId);

        if (!$entry instanceof WorkoutEntry || $entry->getWorkoutSession()->getId() !== $session->getId()) {
            return $this->json(['message' => 'Ejercicio de sesión no encontrado.'], Response::HTTP_NOT_FOUND);
        }

        $session->removeWorkoutEntry($entry);
        $this->entityManager->remove($entry);
        $this->entityManager->flush();

        return $this->json(['item' => $this->workoutSessionAssembler->assemble($session)]);
    }

    #[Route('/api/workout-sessions/{id}/entries/{entryId}', name: 'api_workout_sessions_update_entry', requirements: ['id' => '\\d+', 'entryId' => '\\d+'], methods: ['PUT'])]
    public function updateEntry(int $id, int $entryId, Request $request): JsonResponse
    {
        $session = $this->workoutSessionRepository->find($id);

        if (!$session instanceof WorkoutSession) {
            return $this->json(['message' => 'Sesión no encontrada.'], Response::HTTP_NOT_FOUND);
        }

        $entry = $this->workoutEntryRepository->find($entryId);

        if (!$entry instanceof WorkoutEntry || $entry->getWorkoutSession()->getId() !== $session->getId()) {
            return $this->json(['message' => 'Ejercicio de sesión no encontrado.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(['message' => 'El cuerpo de la petición no es válido.'], Response::HTTP_BAD_REQUEST);
        }

        $input = $this->addWorkoutEntryInputFactory->fromArray($payload);

        $exercise = $this->exerciseRepository->find($input->exerciseId);

        if ($exercise === null || !$exercise->isActive() || $exercise->getId() !== $entry->getExercise()->getId()) {
            return $this->json(['message' => 'Ejercicio no encontrado.'], Response::HTTP_NOT_FOUND);
        }

        $errors = $this->addWorkoutEntryInputValidator->validate($input, $exercise->getType());

        if ($errors !== []) {
            return $this->json(['message' => 'Hay errores de validación.', 'errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->workoutEntryUpdater->update($entry, $exercise, $input);

        return $this->json(['item' => $this->workoutSessionAssembler->assemble($session)]);
    }

    /**
     * Valida el payload de creación de sesiones de entrenamiento.
     *
     * @param array<string, mixed> $payload
     *
     * @return array<string, string>
     */
    private function validatePayload(array $payload): array
    {
        // Inicializa el mapa de errores por campo.
        $errors = [];

        // Valida que la fecha exista, sea texto y use el formato Y-m-d real.
        if (!isset($payload['sessionDate']) || !is_string($payload['sessionDate']) || $this->isValidDate($payload['sessionDate']) === false) {
            // Registra error cuando la fecha falta o no representa una fecha válida.
            $errors['sessionDate'] = 'La fecha de la sesión no es válida.';
        }

        // Valida el nombre solo cuando el cliente lo envía.
        if (isset($payload['name']) && $payload['name'] !== null) {
            // Rechaza nombres que no sean texto.
            if (!is_string($payload['name'])) {
                // Registra error de tipo para el nombre.
                $errors['name'] = 'El nombre no es válido.';
            // Rechaza nombres que superan la longitud máxima de la entidad.
            } elseif (mb_strlen(trim($payload['name'])) > 120) {
                // Registra error de longitud máxima.
                $errors['name'] = 'El nombre no puede superar los 120 caracteres.';
            }
        }

        // Valida la sensación general solo cuando el cliente la envía.
        if (isset($payload['mood']) && $payload['mood'] !== null) {
            // Requiere texto y pertenencia al catálogo de sensaciones permitidas.
            if (!is_string($payload['mood']) || !array_key_exists($payload['mood'], self::MOOD_LABELS)) {
                // Registra error de sensación no reconocida.
                $errors['mood'] = 'La sensación general no es válida.';
            }
        }

        // Valida que notes sea string cuando se envía un valor distinto de null.
        if (isset($payload['notes']) && $payload['notes'] !== null && !is_string($payload['notes'])) {
            // Registra error si las notas tienen un tipo incompatible.
            $errors['notes'] = 'Las notas no son válidas.';
        }

        // Devuelve el mapa vacío cuando el payload es válido.
        return $errors;
    }

    /**
     * Comprueba que un texto represente una fecha exacta en formato Y-m-d.
     */
    private function isValidDate(string $value): bool
    {
        // Intenta crear una fecha estricta desde el formato esperado.
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        // Recupera warnings y errores generados por el parseo.
        $errors = \DateTimeImmutable::getLastErrors();

        // Exige objeto válido, misma representación textual y ausencia de warnings/errores.
        return $date instanceof \DateTimeImmutable
            && $date->format('Y-m-d') === $value
            && ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0));
    }

    /**
     * Convierte una fecha validada en DateTimeImmutable.
     */
    private function parseSessionDate(string $value): \DateTimeImmutable
    {
        // Crea la fecha con hora inicial en medianoche.
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        // Protege el método ante llamadas internas con datos no validados.
        if (!$date instanceof \DateTimeImmutable) {
            // Lanza una excepción explícita porque este caso indica un error de programación.
            throw new \InvalidArgumentException('Invalid session date.');
        }

        // Devuelve la fecha lista para la entidad.
        return $date;
    }

    /**
     * Normaliza un valor opcional de texto convirtiendo valores no string o vacíos en null.
     */
    private function normalizeOptionalString(mixed $value): ?string
    {
        // Cualquier valor no textual se interpreta como ausencia de dato.
        if (!is_string($value)) {
            // Devuelve null como representación única de vacío.
            return null;
        }

        // Recorta espacios externos antes de almacenar el valor.
        $value = trim($value);

        // Convierte cadenas vacías a null y conserva el texto útil.
        return $value === '' ? null : $value;
    }

    /**
     * Normaliza la sensación general manteniendo solo valores permitidos.
     */
    private function normalizeMood(mixed $value): ?string
    {
        // Descarta cualquier valor no textual.
        if (!is_string($value)) {
            // Devuelve null cuando la sensación no se ha informado correctamente.
            return null;
        }

        // Conserva el valor solo si existe en el catálogo permitido.
        return array_key_exists($value, self::MOOD_LABELS) ? $value : null;
    }

}
