<?php

namespace App\Controller;

use App\Application\Service\ExerciseProgressRecommendationService;
use App\Entity\Exercise;
use App\Entity\ExerciseType;
use App\Entity\WorkoutEntry;
use App\Entity\WorkoutSet;
use App\Repository\ExerciseRepository;
use App\Repository\WorkoutEntryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Expone la API REST para consultar y mantener el catálogo de ejercicios.
 */
final class ExerciseController extends AbstractController
{
    /**
     * Recibe las dependencias necesarias para leer ejercicios, calcular rendimiento y persistir cambios.
     */
    public function __construct(
        private readonly ExerciseRepository $exerciseRepository,
        private readonly WorkoutEntryRepository $workoutEntryRepository,
        private readonly EntityManagerInterface $entityManager,
        ?ExerciseProgressRecommendationService $exerciseProgressRecommendationService = null,
    ) {
        $this->exerciseProgressRecommendationService = $exerciseProgressRecommendationService ?? new ExerciseProgressRecommendationService();
    }

    private readonly ExerciseProgressRecommendationService $exerciseProgressRecommendationService;

    /**
     * Lista los ejercicios activos ordenados por nombre.
     */
    #[Route('/api/exercises', name: 'api_exercises_index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        // Transforma cada entidad activa en el contrato JSON consumido por el frontend.
        $items = array_map(
            // Serializa un ejercicio individual manteniendo un formato de salida uniforme.
            fn (Exercise $exercise): array => $this->serializeExercise($exercise),
            // Obtiene únicamente ejercicios activos y ya ordenados desde el repositorio.
            $this->exerciseRepository->findActiveOrderedByName(),
        );

        // Devuelve la colección envuelta en la clave estable `items`.
        return $this->json(['items' => $items]);
    }

    /**
     * Crea un nuevo ejercicio a partir del JSON recibido.
     */
    #[Route('/api/exercises', name: 'api_exercises_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // Decodifica el cuerpo JSON como array asociativo para poder validarlo.
        $payload = json_decode($request->getContent(), true);

        // Rechaza cuerpos que no sean objetos JSON válidos.
        if (!is_array($payload)) {
            // Informa al cliente de que el formato general del cuerpo no es aceptable.
            return $this->json(['message' => 'El cuerpo de la petición no es válido.'], Response::HTTP_BAD_REQUEST);
        }

        // Valida reglas de negocio antes de construir la entidad.
        $errors = $this->validatePayload($payload);

        // Detiene la creación cuando hay errores de validación por campo.
        if ($errors !== []) {
            // Devuelve 422 porque el JSON es correcto, pero los datos no son procesables.
            return $this->json(['message' => 'Hay errores de validación.', 'errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Convierte el string validado al enum interno del dominio.
        $type = ExerciseType::from($payload['type']);
        // Crea la entidad con el nombre sin espacios externos y el tipo elegido.
        $exercise = new Exercise(trim($payload['name']), $type);
        // Normaliza grupos musculares eliminando vacíos, duplicados y espacios externos.
        $exercise->setMuscleGroups($this->normalizeMuscleGroups($payload['muscleGroups'] ?? []));
        // Normaliza notas opcionales convirtiendo strings vacíos en null.
        $exercise->setNotes($this->normalizeOptionalString($payload['notes'] ?? null));

        // Registra la entidad nueva para que Doctrine la inserte en base de datos.
        $this->entityManager->persist($exercise);
        // Ejecuta la inserción pendiente y asigna el identificador generado.
        $this->entityManager->flush();

        // Devuelve el recurso creado con código HTTP 201.
        return $this->json(['item' => $this->serializeExercise($exercise)], Response::HTTP_CREATED);
    }

    /**
     * Muestra un ejercicio activo por identificador.
     */
    #[Route('/api/exercises/{id}', name: 'api_exercises_show', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        // Busca el ejercicio por clave primaria.
        $exercise = $this->exerciseRepository->find($id);

        // Trata como no encontrado tanto la ausencia como el borrado lógico.
        if (!$exercise instanceof Exercise || !$exercise->isActive()) {
            // Devuelve una respuesta homogénea para no exponer detalles internos.
            return $this->json(['message' => 'Ejercicio no encontrado.'], Response::HTTP_NOT_FOUND);
        }

        // Serializa el ejercicio encontrado en la clave estable `item`.
        return $this->json(['item' => $this->serializeExercise($exercise)]);
    }

    #[Route('/api/exercises/{id}/progress', name: 'api_exercises_progress', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function progress(int $id): JsonResponse
    {
        $exercise = $this->exerciseRepository->find($id);

        if (!$exercise instanceof Exercise || !$exercise->isActive()) {
            return $this->json(['message' => 'Ejercicio no encontrado.'], Response::HTTP_NOT_FOUND);
        }

        $entries = $this->workoutEntryRepository->createQueryBuilder('entry')
            ->join('entry.workoutSession', 'session')
            ->addSelect('session')
            ->leftJoin('entry.workoutSets', 'workoutSet')
            ->addSelect('workoutSet')
            ->andWhere('entry.exercise = :exercise')
            ->setParameter('exercise', $exercise)
            ->orderBy('session.sessionDate', 'DESC')
            ->addOrderBy('entry.id', 'DESC')
            ->getQuery()
            ->getResult();

        if (!is_array($entries)) {
            $entries = [];
        }

        $items = array_map(
            fn (WorkoutEntry $entry): array => $this->serializeProgressEntry($entry),
            array_filter($entries, fn (mixed $entry): bool => $entry instanceof WorkoutEntry),
        );

        $summary = $this->buildProgressSummary($entries);
        $recommendation = $this->exerciseProgressRecommendationService->recommend($exercise, $items);

        return $this->json([
            'item' => $this->serializeExerciseForProgress($exercise, $summary['lastTopSet']),
            'summary' => $summary,
            'items' => $items,
            'recommendation' => $recommendation,
        ]);
    }

    /**
     * Actualiza completamente los datos editables de un ejercicio activo.
     */
    #[Route('/api/exercises/{id}', name: 'api_exercises_update', requirements: ['id' => '\\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        // Localiza el ejercicio que se pretende modificar.
        $exercise = $this->exerciseRepository->find($id);

        // No permite actualizar ejercicios inexistentes o desactivados.
        if (!$exercise instanceof Exercise || !$exercise->isActive()) {
            // Responde 404 para ambos casos de recurso no disponible.
            return $this->json(['message' => 'Ejercicio no encontrado.'], Response::HTTP_NOT_FOUND);
        }

        // Decodifica el JSON recibido para aplicar una actualización completa.
        $payload = json_decode($request->getContent(), true);

        // Verifica que el cuerpo sea un objeto JSON válido.
        if (!is_array($payload)) {
            // Devuelve 400 cuando no se puede interpretar la petición.
            return $this->json(['message' => 'El cuerpo de la petición no es válido.'], Response::HTTP_BAD_REQUEST);
        }

        // Reutiliza las reglas de validación de creación porque el PUT exige el payload completo.
        $errors = $this->validatePayload($payload);

        // Evita persistir cambios cuando hay datos inválidos.
        if ($errors !== []) {
            // Devuelve los errores concretos para que el cliente pueda corregir el formulario.
            return $this->json(['message' => 'Hay errores de validación.', 'errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Aplica los cambios normalizados sobre la entidad gestionada por Doctrine.
        $exercise
            // Actualiza el nombre sin espacios externos.
            ->setName(trim($payload['name']))
            // Actualiza el tipo convirtiendo el valor validado al enum.
            ->setType(ExerciseType::from($payload['type']))
            // Actualiza los grupos musculares con valores limpios y únicos.
            ->setMuscleGroups($this->normalizeMuscleGroups($payload['muscleGroups'] ?? []))
            // Actualiza las notas opcionales con null para valores vacíos.
            ->setNotes($this->normalizeOptionalString($payload['notes'] ?? null));

        // Persiste los cambios detectados en la entidad ya gestionada.
        $this->entityManager->flush();

        // Devuelve el ejercicio actualizado con el mismo contrato de lectura.
        return $this->json(['item' => $this->serializeExercise($exercise)]);
    }

    /**
     * Desactiva un ejercicio mediante borrado lógico.
     */
    #[Route('/api/exercises/{id}', name: 'api_exercises_delete', requirements: ['id' => '\\d+'], methods: ['DELETE'])]
    public function delete(int $id): Response
    {
        // Busca el ejercicio solicitado para borrado lógico.
        $exercise = $this->exerciseRepository->find($id);

        // Impide borrar recursos inexistentes o ya desactivados.
        if (!$exercise instanceof Exercise || !$exercise->isActive()) {
            // Mantiene la misma respuesta 404 usada en lectura y actualización.
            return $this->json(['message' => 'Ejercicio no encontrado.'], Response::HTTP_NOT_FOUND);
        }

        // Marca el ejercicio como inactivo sin eliminar datos históricos relacionados.
        $exercise->setIsActive(false);
        // Guarda el cambio de estado en base de datos.
        $this->entityManager->flush();

        // Responde sin cuerpo para indicar que el borrado lógico se completó.
        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Valida el payload de creación/actualización de ejercicios.
     *
     * @param array<string, mixed> $payload
     *
     * @return array<string, string>
     */
    private function validatePayload(array $payload): array
    {
        // Inicializa el mapa de errores indexado por nombre de campo.
        $errors = [];

        // Comprueba obligatoriedad y tipo del nombre.
        if (!isset($payload['name']) || !is_string($payload['name']) || trim($payload['name']) === '') {
            // Registra error cuando el nombre falta, no es string o queda vacío al recortarlo.
            $errors['name'] = 'El nombre es obligatorio.';
        // Comprueba longitud máxima una vez descartado el caso vacío.
        } elseif (mb_strlen(trim($payload['name'])) > 120) {
            // Registra error si el nombre excede el límite definido por la entidad.
            $errors['name'] = 'El nombre no puede superar los 120 caracteres.';
        }

        // Verifica que el tipo exista y corresponda con un valor válido del enum.
        if (!isset($payload['type']) || !is_string($payload['type']) || ExerciseType::tryFrom($payload['type']) === null) {
            // Registra error de tipo inválido cuando no se puede mapear al enum.
            $errors['type'] = 'El tipo de ejercicio no es válido.';
        }

        // Valida que muscleGroups, si llega, sea una lista/array.
        if (isset($payload['muscleGroups']) && !is_array($payload['muscleGroups'])) {
            // Registra error cuando el cliente envía un tipo incompatible.
            $errors['muscleGroups'] = 'Los músculos trabajados no son válidos.';
        }

        // Recorre muscleGroups solo cuando su estructura base es un array.
        if (isset($payload['muscleGroups']) && is_array($payload['muscleGroups'])) {
            // Valida individualmente cada grupo muscular recibido.
            foreach ($payload['muscleGroups'] as $muscleGroup) {
                // Rechaza elementos que no sean texto.
                if (!is_string($muscleGroup)) {
                    // Usa un único mensaje para cualquier elemento inválido de la lista.
                    $errors['muscleGroups'] = 'Los músculos trabajados no son válidos.';
                    // Detiene el recorrido al encontrar el primer elemento inválido.
                    break;
                }
            }
        }

        // Valida que notes sea string cuando se envía un valor distinto de null.
        if (isset($payload['notes']) && $payload['notes'] !== null && !is_string($payload['notes'])) {
            // Registra error si las notas tienen un tipo no soportado.
            $errors['notes'] = 'Las notas no son válidas.';
        }

        // Devuelve el mapa vacío cuando no hay errores.
        return $errors;
    }

    /**
     * Limpia la lista de grupos musculares eliminando valores vacíos y duplicados.
     *
     * @param list<string> $muscleGroups
     *
     * @return list<string>
     */
    private function normalizeMuscleGroups(array $muscleGroups): array
    {
        // Acumula los grupos musculares válidos tras recortar espacios.
        $normalized = [];

        // Procesa cada valor enviado por el cliente.
        foreach ($muscleGroups as $muscleGroup) {
            // Elimina espacios al inicio y al final.
            $value = trim($muscleGroup);

            // Ignora elementos vacíos para no guardar ruido en la columna JSON.
            if ($value !== '') {
                // Añade el valor limpio conservando el orden de llegada.
                $normalized[] = $value;
            }
        }

        // Elimina duplicados y reindexa para garantizar una lista JSON limpia.
        return array_values(array_unique($normalized));
    }

    /**
     * Normaliza un valor opcional de texto convirtiendo valores no string o vacíos en null.
     */
    private function normalizeOptionalString(mixed $value): ?string
    {
        // Cualquier valor no textual se trata como ausencia de dato.
        if (!is_string($value)) {
            // Devuelve null para mantener una representación única de vacío.
            return null;
        }

        // Recorta espacios externos antes de persistir o serializar.
        $value = trim($value);

        // Convierte cadenas vacías a null y conserva el texto útil.
        return $value === '' ? null : $value;
    }

    /**
     * Convierte una entidad Exercise al contrato JSON público.
     *
     * @return array{id:int|null,name:string,type:string,typeLabel:string,muscleGroups:list<string>,notes:string|null,icon:string,lastPerformance:string|null}
     */
    private function serializeExercise(Exercise $exercise): array
    {
        // Construye un array estable para desacoplar la API de la entidad Doctrine.
        return [
            // Expone el identificador generado por base de datos.
            'id' => $exercise->getId(),
            // Expone el nombre visible del ejercicio.
            'name' => $exercise->getName(),
            // Expone el valor técnico del enum para formularios y filtros.
            'type' => $exercise->getType()->value,
            // Expone una etiqueta humana localizada para la interfaz.
            'typeLabel' => $this->typeLabel($exercise->getType()),
            // Expone los grupos musculares normalizados.
            'muscleGroups' => $exercise->getMuscleGroups(),
            // Expone notas opcionales.
            'notes' => $exercise->getNotes(),
            // Expone el icono Material asociado al tipo.
            'icon' => $this->typeIcon($exercise->getType()),
            // Expone el último rendimiento calculado desde sesiones previas.
            'lastPerformance' => $this->lastPerformance($exercise),
        ];
    }

    /**
     * Devuelve la etiqueta visible de un tipo de ejercicio.
     */
    private function typeLabel(ExerciseType $type): string
    {
        // Mapea cada enum interno a su etiqueta en castellano.
        return match ($type) {
            ExerciseType::Strength => 'Fuerza',
            ExerciseType::Cardio => 'Cardio',
            ExerciseType::Core => 'Abdomen',
            ExerciseType::Other => 'Otros',
        };
    }

    /**
     * Devuelve el nombre del icono Material asociado a un tipo de ejercicio.
     */
    private function typeIcon(ExerciseType $type): string
    {
        // Mapea cada tipo al icono que entiende el frontend.
        return match ($type) {
            ExerciseType::Strength => 'fitness_center',
            ExerciseType::Cardio => 'directions_run',
            ExerciseType::Core => 'sports_gymnastics',
            ExerciseType::Other => 'exercise',
        };
    }

    /**
     * Calcula una descripción corta del último set registrado para un ejercicio.
     */
    private function lastPerformance(Exercise $exercise): ?string
    {
        // Busca la entrada más reciente del ejercicio ordenando por fecha de sesión e id de entrada.
        $entry = $this->workoutEntryRepository->createQueryBuilder('entry')
            // Une la sesión para poder ordenar por fecha de entrenamiento.
            ->join('entry.workoutSession', 'session')
            // Filtra por el ejercicio actual.
            ->andWhere('entry.exercise = :exercise')
            // Pasa la entidad como parámetro seguro de Doctrine.
            ->setParameter('exercise', $exercise)
            // Prioriza la sesión más reciente.
            ->orderBy('session.sessionDate', 'DESC')
            // Desempata por la entrada más nueva dentro de la sesión.
            ->addOrderBy('entry.id', 'DESC')
            // Solo necesita una entrada para mostrar el resumen.
            ->setMaxResults(1)
            // Construye la query Doctrine desde el QueryBuilder.
            ->getQuery()
            // Recupera una única entrada o null si no hay histórico.
            ->getOneOrNullResult();

        // Si no hay entrada o no contiene sets, no existe rendimiento que mostrar.
        if ($entry === null || $entry->getWorkoutSets()->isEmpty()) {
            // Devuelve null para que el frontend pueda ocultar este dato.
            return null;
        }

        // Convierte la colección Doctrine en array para ordenarla por número de set.
        $sets = $entry->getWorkoutSets()->toArray();
        // Ordena ascendentemente para considerar como último set el de mayor setNumber.
        usort($sets, fn (WorkoutSet $a, WorkoutSet $b): int => $a->getSetNumber() <=> $b->getSetNumber());

        // Formatea el último set de la entrada reciente.
        return $this->formatSet($sets[array_key_last($sets)]);
    }

    /**
     * Convierte un set en una frase corta de rendimiento.
     */
    private function formatSet(WorkoutSet $set): ?string
    {
        // Prioriza fuerza cuando hay peso y repeticiones.
        if ($set->getWeightKg() !== null && $set->getReps() !== null) {
            // Devuelve formato clásico de carga por repeticiones.
            return sprintf('%s kg x %d reps', $this->formatNumber($set->getWeightKg()), $set->getReps());
        }

        // Usa formato cardio completo cuando hay duración y distancia.
        if ($set->getDurationSeconds() !== null && $set->getDistanceMeters() !== null) {
            // Convierte metros a kilómetros y duración a texto legible.
            return sprintf('%s · %s km', $this->formatDuration($set->getDurationSeconds()), $this->formatNumber($set->getDistanceMeters() / 1000));
        }

        // Usa solo duración cuando no hay distancia.
        if ($set->getDurationSeconds() !== null) {
            // Devuelve segundos o minutos según corresponda.
            return $this->formatDuration($set->getDurationSeconds());
        }

        // Usa solo repeticiones cuando el set no tiene peso ni duración.
        if ($set->getReps() !== null) {
            // Devuelve el conteo de repeticiones.
            return sprintf('%d reps', $set->getReps());
        }

        // Devuelve null si el set no tiene métricas principales.
        return null;
    }

    /**
     * Formatea una duración en segundos como texto corto.
     */
    private function formatDuration(int $seconds): string
    {
        // Para duraciones menores a un minuto, conserva segundos.
        if ($seconds < 60) {
            // Devuelve el valor con sufijo de segundos.
            return sprintf('%ds', $seconds);
        }

        // Calcula los minutos completos.
        $minutes = intdiv($seconds, 60);
        // Calcula los segundos restantes tras extraer minutos.
        $remainingSeconds = $seconds % 60;

        // Evita mostrar `:00` cuando la duración cae exacta en minutos.
        if ($remainingSeconds === 0) {
            // Devuelve minutos enteros.
            return sprintf('%d min', $minutes);
        }

        // Devuelve formato minutos:segundos con dos dígitos de segundos.
        return sprintf('%d:%02d min', $minutes, $remainingSeconds);
    }

    /**
     * Formatea números con máximo un decimal y sin ceros finales.
     */
    private function formatNumber(float $value): string
    {
        // Redondea a un decimal y elimina ceros o punto final innecesarios.
        return rtrim(rtrim(number_format($value, 1, '.', ''), '0'), '.');
    }

    /**
     * @param list<WorkoutEntry> $entries
     *
     * @return array{sessions:int,bestTopSet:string|null,lastTopSet:string|null,totalVolumeKg:float,totalDurationSeconds:int}
     */
    private function buildProgressSummary(array $entries): array
    {
        $bestTopSet = null;
        $lastTopSet = null;
        $totalVolumeKg = 0.0;
        $totalDurationSeconds = 0;

        foreach ($entries as $entry) {
            if (!$entry instanceof WorkoutEntry) {
                continue;
            }

            $topSet = $this->topSet($entry);
            if ($topSet !== null) {
                if ($lastTopSet === null) {
                    $lastTopSet = $topSet;
                }

                if ($bestTopSet === null || $this->compareTopSet($topSet, $bestTopSet) > 0) {
                    $bestTopSet = $topSet;
                }
            }

            foreach ($entry->getWorkoutSets() as $set) {
                if ($set->getWeightKg() !== null && $set->getReps() !== null) {
                    $totalVolumeKg += $set->getWeightKg() * $set->getReps();
                }

                if ($set->getDurationSeconds() !== null) {
                    $totalDurationSeconds += $set->getDurationSeconds();
                }
            }
        }

        return [
            'sessions' => count($entries),
            'bestTopSet' => $bestTopSet !== null ? $this->formatSet($bestTopSet) : null,
            'lastTopSet' => $lastTopSet !== null ? $this->formatSet($lastTopSet) : null,
            'totalVolumeKg' => $totalVolumeKg,
            'totalDurationSeconds' => $totalDurationSeconds,
        ];
    }

    /**
     * @return array{sessionId:int|null,sessionDate:string,entryId:int|null,topSet:string|null,topSetWeightKg:float|null,topSetReps:int|null,volumeKg:float,durationSeconds:int,setsCount:int,sets:list<array{setNumber:int,weightKg:float|null,reps:int|null,durationSeconds:int|null,distanceMeters:float|null,speedKmh:float|null,incline:float|null,resistanceLevel:int|null,calories:int|null,notes:string|null}>}
     */
    private function serializeProgressEntry(WorkoutEntry $entry): array
    {
        $sets = $entry->getWorkoutSets()->toArray();
        usort($sets, fn (WorkoutSet $a, WorkoutSet $b): int => $a->getSetNumber() <=> $b->getSetNumber());

        $topSet = $this->topSet($entry);
        $volumeKg = 0.0;
        $durationSeconds = 0;

        foreach ($sets as $set) {
            if ($set->getWeightKg() !== null && $set->getReps() !== null) {
                $volumeKg += $set->getWeightKg() * $set->getReps();
            }

            if ($set->getDurationSeconds() !== null) {
                $durationSeconds += $set->getDurationSeconds();
            }
        }

        return [
            'sessionId' => $entry->getWorkoutSession()->getId(),
            'sessionDate' => $entry->getWorkoutSession()->getSessionDate()->format('Y-m-d'),
            'entryId' => $entry->getId(),
            'topSet' => $topSet !== null ? $this->formatSet($topSet) : null,
            'topSetWeightKg' => $topSet?->getWeightKg(),
            'topSetReps' => $topSet?->getReps(),
            'volumeKg' => $volumeKg,
            'durationSeconds' => $durationSeconds,
            'setsCount' => count($sets),
            'sets' => array_map(
                fn (WorkoutSet $set): array => [
                    'setNumber' => $set->getSetNumber(),
                    'weightKg' => $set->getWeightKg(),
                    'reps' => $set->getReps(),
                    'durationSeconds' => $set->getDurationSeconds(),
                    'distanceMeters' => $set->getDistanceMeters(),
                    'speedKmh' => $set->getSpeedKmh(),
                    'incline' => $set->getIncline(),
                    'resistanceLevel' => $set->getResistanceLevel(),
                    'calories' => $set->getCalories(),
                    'notes' => $set->getNotes(),
                ],
                $sets,
            ),
        ];
    }

    private function topSet(WorkoutEntry $entry): ?WorkoutSet
    {
        $topSet = null;

        foreach ($entry->getWorkoutSets() as $set) {
            if ($set->getWeightKg() === null || $set->getReps() === null) {
                continue;
            }

            if ($topSet === null || $this->compareTopSet($set, $topSet) > 0) {
                $topSet = $set;
            }
        }

        return $topSet;
    }

    private function compareTopSet(WorkoutSet $candidate, WorkoutSet $reference): int
    {
        $weightComparison = ($candidate->getWeightKg() ?? 0.0) <=> ($reference->getWeightKg() ?? 0.0);

        if ($weightComparison !== 0) {
            return $weightComparison;
        }

        return ($candidate->getReps() ?? 0) <=> ($reference->getReps() ?? 0);
    }

    /**
     * @return array{id:int|null,name:string,type:string,typeLabel:string,muscleGroups:list<string>,notes:string|null,icon:string,lastPerformance:string|null}
     */
    private function serializeExerciseForProgress(Exercise $exercise, ?string $lastTopSet): array
    {
        return [
            'id' => $exercise->getId(),
            'name' => $exercise->getName(),
            'type' => $exercise->getType()->value,
            'typeLabel' => $this->typeLabel($exercise->getType()),
            'muscleGroups' => $exercise->getMuscleGroups(),
            'notes' => $exercise->getNotes(),
            'icon' => $this->typeIcon($exercise->getType()),
            'lastPerformance' => $lastTopSet,
        ];
    }
}
