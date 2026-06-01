<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Entity\Exercise;

/**
 * Calcula recomendaciones de carga a partir del historial disponible.
 */
final class ExerciseProgressRecommendationService
{
    private const DEFAULT_INCREMENT_KG = 2.5;
    private const LEGS_INCREMENT_KG = 5.0;

    /**
     * @param list<array{topSetWeightKg:float|null,topSetReps:int|null,volumeKg:float,sessionDate:string}> $progressItems
     *
     * @return array{action:string,reason:string,suggestedWeightKg:float|null,deltaKg:float|null,confidence:string}
     */
    public function recommend(Exercise $exercise, array $progressItems): array
    {
        $strengthItems = array_values(array_filter(
            $progressItems,
            static fn (array $item): bool => $item['topSetWeightKg'] !== null && $item['topSetReps'] !== null,
        ));

        if (count($strengthItems) < 2) {
            return $this->maintain('Faltan al menos dos sesiones de fuerza comparables para sugerir cambios.', 'low');
        }

        $latest = $strengthItems[0];
        $previous = $strengthItems[1];

        if ($this->shouldDecrease($latest, $previous)) {
            return $this->decrease($latest, 'Se detecta bajada de rendimiento reciente; conviene ajustar la carga.');
        }

        if ($this->shouldIncrease($latest, $previous)) {
            return $this->increase($exercise, $latest, 'Hay estabilidad o mejora en dos sesiones consecutivas; puedes subir carga.');
        }

        return $this->maintain('Mantener peso permite consolidar tecnica y repetir rendimiento.', 'medium');
    }

    /**
     * @param array{topSetWeightKg:float|null,topSetReps:int|null,volumeKg:float,sessionDate:string} $latest
     * @param array{topSetWeightKg:float|null,topSetReps:int|null,volumeKg:float,sessionDate:string} $previous
     */
    private function shouldIncrease(array $latest, array $previous): bool
    {
        if ($latest['topSetWeightKg'] === null || $previous['topSetWeightKg'] === null) {
            return false;
        }

        if (abs($latest['topSetWeightKg'] - $previous['topSetWeightKg']) > 0.001) {
            return false;
        }

        if ($latest['topSetReps'] === null || $previous['topSetReps'] === null) {
            return false;
        }

        if ($latest['topSetReps'] < $previous['topSetReps']) {
            return false;
        }

        return $this->volumeDropRatio($latest['volumeKg'], $previous['volumeKg']) <= 0.10;
    }

    /**
     * @param array{topSetWeightKg:float|null,topSetReps:int|null,volumeKg:float,sessionDate:string} $latest
     * @param array{topSetWeightKg:float|null,topSetReps:int|null,volumeKg:float,sessionDate:string} $previous
     */
    private function shouldDecrease(array $latest, array $previous): bool
    {
        $repsDrop = ($previous['topSetReps'] ?? 0) - ($latest['topSetReps'] ?? 0);
        $sameOrLowerWeight = ($latest['topSetWeightKg'] ?? 0.0) <= ($previous['topSetWeightKg'] ?? 0.0);

        if ($sameOrLowerWeight && $repsDrop >= 2) {
            return true;
        }

        return $this->volumeDropRatio($latest['volumeKg'], $previous['volumeKg']) > 0.15;
    }

    private function volumeDropRatio(float $latestVolumeKg, float $previousVolumeKg): float
    {
        if ($previousVolumeKg <= 0.0) {
            return 0.0;
        }

        $drop = $previousVolumeKg - $latestVolumeKg;

        if ($drop <= 0.0) {
            return 0.0;
        }

        return $drop / $previousVolumeKg;
    }

    /**
     * @param array{topSetWeightKg:float|null,topSetReps:int|null,volumeKg:float,sessionDate:string} $latest
     *
     * @return array{action:string,reason:string,suggestedWeightKg:float|null,deltaKg:float|null,confidence:string}
     */
    private function increase(Exercise $exercise, array $latest, string $reason): array
    {
        $currentWeight = $latest['topSetWeightKg'];

        if ($currentWeight === null) {
            return $this->maintain('No hay peso de referencia para calcular una subida.', 'low');
        }

        $delta = $this->incrementForExercise($exercise->getName());
        $suggested = max(0.0, $currentWeight + $delta);

        return [
            'action' => 'increase',
            'reason' => $reason,
            'suggestedWeightKg' => $suggested,
            'deltaKg' => $delta,
            'confidence' => 'high',
        ];
    }

    /**
     * @param array{topSetWeightKg:float|null,topSetReps:int|null,volumeKg:float,sessionDate:string} $latest
     *
     * @return array{action:string,reason:string,suggestedWeightKg:float|null,deltaKg:float|null,confidence:string}
     */
    private function decrease(array $latest, string $reason): array
    {
        $currentWeight = $latest['topSetWeightKg'];

        if ($currentWeight === null) {
            return $this->maintain('No hay peso de referencia para calcular una bajada.', 'low');
        }

        $suggested = max(0.0, round($currentWeight * 0.95, 1));

        return [
            'action' => 'decrease',
            'reason' => $reason,
            'suggestedWeightKg' => $suggested,
            'deltaKg' => round($suggested - $currentWeight, 1),
            'confidence' => 'medium',
        ];
    }

    /**
     * @return array{action:string,reason:string,suggestedWeightKg:float|null,deltaKg:float|null,confidence:string}
     */
    private function maintain(string $reason, string $confidence): array
    {
        return [
            'action' => 'maintain',
            'reason' => $reason,
            'suggestedWeightKg' => null,
            'deltaKg' => null,
            'confidence' => $confidence,
        ];
    }

    private function incrementForExercise(string $exerciseName): float
    {
        $normalized = mb_strtolower($exerciseName);

        foreach (['sentadilla', 'prensa', 'peso muerto', 'hack', 'zancada', 'hip thrust', 'leg press'] as $keyword) {
            if (str_contains($normalized, $keyword)) {
                return self::LEGS_INCREMENT_KG;
            }
        }

        return self::DEFAULT_INCREMENT_KG;
    }
}
