<?php

declare(strict_types=1);

namespace App\Application\Dto;

/**
 * DTO con los datos necesarios para anadir una entrada a una sesion.
 */
final readonly class AddWorkoutEntryInput
{
    /**
     * @param int $exerciseId Identificador del ejercicio seleccionado.
     * @param list<WorkoutSetInput> $sets Listado de series de la entrada.
     * @param string|null $notes Notas opcionales de la entrada.
     */
    public function __construct(
        public int $exerciseId,
        public array $sets,
        public ?string $notes,
    ) {
    }
}
