<?php

declare(strict_types=1);

namespace App\Application\Validation;

use App\Application\Dto\AddWorkoutEntryInput;
use App\Entity\ExerciseType;

/**
 * Valida reglas de negocio para anadir entradas con series.
 */
final class AddWorkoutEntryInputValidator
{
    /**
     * @return array<string, string>
     */
    public function validate(AddWorkoutEntryInput $input, ExerciseType $exerciseType): array
    {
        $errors = [];

        if ($input->exerciseId <= 0) {
            $errors['exerciseId'] = 'El ejercicio no es válido.';
        }

        if ($input->sets === []) {
            $errors['sets'] = 'Debes añadir al menos una serie.';

            return $errors;
        }

        foreach ($input->sets as $index => $set) {
            if ($set->setNumber <= 0) {
                $errors[sprintf('sets.%d.setNumber', $index)] = 'El número de serie no es válido.';
            }

            if ($set->weightKg !== null && $set->weightKg <= 0) {
                $errors[sprintf('sets.%d.weightKg', $index)] = 'El peso no es válido.';
            }

            if ($set->reps !== null && $set->reps <= 0) {
                $errors[sprintf('sets.%d.reps', $index)] = 'Las repeticiones no son válidas.';
            }

            if ($set->durationSeconds !== null && $set->durationSeconds <= 0) {
                $errors[sprintf('sets.%d.durationSeconds', $index)] = 'La duración no es válida.';
            }

            if ($set->distanceMeters !== null && $set->distanceMeters <= 0) {
                $errors[sprintf('sets.%d.distanceMeters', $index)] = 'La distancia no es válida.';
            }

            if ($set->speedKmh !== null && $set->speedKmh <= 0) {
                $errors[sprintf('sets.%d.speedKmh', $index)] = 'La velocidad no es válida.';
            }

            if ($set->resistanceLevel !== null && $set->resistanceLevel < 0) {
                $errors[sprintf('sets.%d.resistanceLevel', $index)] = 'La resistencia no es válida.';
            }

            if ($set->calories !== null && $set->calories < 0) {
                $errors[sprintf('sets.%d.calories', $index)] = 'Las calorías no son válidas.';
            }

            if ($exerciseType === ExerciseType::Strength && $set->weightKg === null && $set->reps === null) {
                $errors[sprintf('sets.%d', $index)] = 'Cada serie de fuerza debe tener peso o repeticiones.';
            }

            if ($exerciseType === ExerciseType::Cardio && $set->durationSeconds === null && $set->distanceMeters === null) {
                $errors[sprintf('sets.%d', $index)] = 'Cada bloque de cardio debe tener tiempo o distancia.';
            }

            if (($exerciseType === ExerciseType::Core || $exerciseType === ExerciseType::Other)
                && $set->reps === null
                && $set->durationSeconds === null
            ) {
                $errors[sprintf('sets.%d', $index)] = 'Cada serie debe tener repeticiones o tiempo.';
            }
        }

        return $errors;
    }
}
