<?php

declare(strict_types=1);

namespace App\Application\Dto;

/**
 * DTO con los datos de una serie recibidos desde la API.
 */
final readonly class WorkoutSetInput
{
    /**
     * @param int $setNumber Orden de la serie dentro de la entrada.
     * @param float|null $weightKg Carga en kg para ejercicios de fuerza.
     * @param int|null $reps Repeticiones ejecutadas en la serie.
     * @param int|null $durationSeconds Duracion del bloque en segundos.
     * @param float|null $distanceMeters Distancia recorrida en metros.
     * @param float|null $speedKmh Velocidad media en km/h.
     * @param float|null $incline Inclinacion aplicada en maquina o cinta.
     * @param int|null $resistanceLevel Nivel de resistencia para bici/maquina.
     * @param int|null $calories Calorias registradas en la serie.
     * @param string|null $notes Notas opcionales de la serie.
     */
    public function __construct(
        public int $setNumber,
        public ?float $weightKg,
        public ?int $reps,
        public ?int $durationSeconds,
        public ?float $distanceMeters,
        public ?float $speedKmh,
        public ?float $incline,
        public ?int $resistanceLevel,
        public ?int $calories,
        public ?string $notes,
    ) {
    }
}
