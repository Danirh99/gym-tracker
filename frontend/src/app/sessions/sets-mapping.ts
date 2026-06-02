import { WorkoutSet } from './session.model';
import { CardioSetRow } from './ui/cardio-sets-table.component';
import { CoreOtherSetRow } from './ui/core-other-sets-table.component';
import { StrengthSetRow } from './ui/strength-sets-table.component';

/**
 * Formatea un numero opcional como texto, o vacio cuando es null.
 */
function formatOptionalNumber(value: number | null, decimals = 1): string {
  if (value === null) {
    return '';
  }

  // Para pesos, repeticiones y duraciones evitamos decimales cuando son enteros.
  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(decimals);
}

/**
 * Convierte una serie de fuerza a la fila del formulario.
 */
export function strengthSetToRow(set: WorkoutSet, index: number): StrengthSetRow {
  return {
    setNumber: index + 1,
    weightKg: formatOptionalNumber(set.weightKg),
    reps: formatOptionalNumber(set.reps, 0),
  };
}

/**
 * Convierte una fila del formulario a los datos crudos de una serie de fuerza.
 */
export function strengthRowToSet(row: StrengthSetRow, index: number): { setNumber: number; weightKg: string; reps: string } {
  return {
    setNumber: index + 1,
    weightKg: row.weightKg,
    reps: row.reps,
  };
}

/**
 * Convierte un bloque cardio a la fila del formulario (minutos/km).
 */
export function cardioSetToRow(set: WorkoutSet, index: number): CardioSetRow {
  const durationMinutes = set.durationSeconds === null ? '' : (set.durationSeconds / 60).toString();

  return {
    setNumber: index + 1,
    durationMinutes,
    distanceKm: set.distanceMeters === null ? '' : (set.distanceMeters / 1000).toString(),
    speedKmh: formatOptionalNumber(set.speedKmh),
    incline: formatOptionalNumber(set.incline),
    resistanceLevel: set.resistanceLevel === null ? '' : set.resistanceLevel.toString(),
    calories: set.calories === null ? '' : set.calories.toString(),
  };
}

/**
 * Convierte una fila de core/otro a la fila del formulario.
 */
export function coreOtherSetToRow(set: WorkoutSet, index: number): CoreOtherSetRow {
  return {
    setNumber: index + 1,
    reps: formatOptionalNumber(set.reps, 0),
    durationSeconds: set.durationSeconds === null ? '' : set.durationSeconds.toString(),
    notes: set.notes ?? '',
  };
}
