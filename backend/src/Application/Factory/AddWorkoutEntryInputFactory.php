<?php

declare(strict_types=1);

namespace App\Application\Factory;

use App\Application\Dto\AddWorkoutEntryInput;
use App\Application\Dto\WorkoutSetInput;

/**
 * Convierte payloads HTTP en DTOs de aplicacion para entradas de sesion.
 */
final class AddWorkoutEntryInputFactory
{
    /**
     * @param array<string, mixed> $payload
     */
    public function fromArray(array $payload): AddWorkoutEntryInput
    {
        $setsPayload = isset($payload['sets']) && is_array($payload['sets']) ? $payload['sets'] : [];
        $sets = [];

        foreach ($setsPayload as $setPayload) {
            if (!is_array($setPayload)) {
                continue;
            }

            $sets[] = new WorkoutSetInput(
                setNumber: is_int($setPayload['setNumber'] ?? null) ? $setPayload['setNumber'] : 0,
                weightKg: isset($setPayload['weightKg']) && is_numeric($setPayload['weightKg']) ? (float) $setPayload['weightKg'] : null,
                reps: is_int($setPayload['reps'] ?? null) ? $setPayload['reps'] : null,
                durationSeconds: is_int($setPayload['durationSeconds'] ?? null) ? $setPayload['durationSeconds'] : null,
                distanceMeters: isset($setPayload['distanceMeters']) && is_numeric($setPayload['distanceMeters']) ? (float) $setPayload['distanceMeters'] : null,
                speedKmh: isset($setPayload['speedKmh']) && is_numeric($setPayload['speedKmh']) ? (float) $setPayload['speedKmh'] : null,
                incline: isset($setPayload['incline']) && is_numeric($setPayload['incline']) ? (float) $setPayload['incline'] : null,
                resistanceLevel: is_int($setPayload['resistanceLevel'] ?? null) ? $setPayload['resistanceLevel'] : null,
                calories: is_int($setPayload['calories'] ?? null) ? $setPayload['calories'] : null,
                notes: is_string($setPayload['notes'] ?? null) ? trim($setPayload['notes']) : null,
            );
        }

        return new AddWorkoutEntryInput(
            exerciseId: is_int($payload['exerciseId'] ?? null) ? $payload['exerciseId'] : 0,
            sets: $sets,
            notes: is_string($payload['notes'] ?? null) ? trim($payload['notes']) : null,
        );
    }
}
