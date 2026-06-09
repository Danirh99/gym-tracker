import { Injectable, signal } from '@angular/core';
import { parseOptionalInt, parseOptionalNumber } from '../../core/utils/number.utils';
import { normalizeOptionalString, normalizeSearchText } from '../../core/utils/string.utils';
import { Exercise, ExerciseProgressSet } from '../../exercises/exercise.model';
import { CreateWorkoutSetPayload, WorkoutEntry } from '../session.model';
import { strengthSetToRow } from '../sets-mapping';
import { StrengthSetRow } from '../ui/strength-sets-table.component';

@Injectable()
export class StrengthEntryFormStore {
  /** Texto libre para filtrar ejercicios de fuerza. */
  readonly searchTerm = signal('');

  /** Grupo muscular seleccionado para filtrar ejercicios. */
  readonly selectedMuscleGroup = signal<string | null>(null);

  /** Notas opcionales para la entrada que se creara. */
  readonly notes = signal('');

  /** Ejercicio seleccionado por el usuario. */
  readonly selectedExerciseId = signal<number | null>(null);

  /** Referencia de ultimo rendimiento del ejercicio elegido. */
  readonly exerciseHistory = signal<string | null>(null);

  /** Filas editables de series para fuerza. */
  readonly sets = signal<StrengthSetRow[]>([
    { setNumber: 1, weightKg: '40', reps: '12' },
    { setNumber: 2, weightKg: '45', reps: '10' },
    { setNumber: 3, weightKg: '50', reps: '8' },
  ]);

  selectExercise(exercise: Exercise): void {
    // Guarda el ejercicio activo y su ultimo rendimiento.
    this.selectedExerciseId.set(exercise.id);
    this.exerciseHistory.set(exercise.lastPerformance);
  }

  initFromEntry(entry: WorkoutEntry, exercise: Exercise): void {
    // Hidrata el formulario a partir de una entrada existente para soportar edicion.
    this.selectedExerciseId.set(exercise.id);
    this.exerciseHistory.set(exercise.lastPerformance);
    this.notes.set(entry.notes ?? '');
    this.sets.set(entry.sets.map((set, index) => strengthSetToRow(set, index)));
  }

  initFromLastSession(sets: ExerciseProgressSet[]): void {
    // Precarga las filas con los datos de la ultima sesion del ejercicio seleccionado.
    if (sets.length === 0) {
      return;
    }

    this.sets.set(
      sets.map((set) => ({
        setNumber: set.setNumber,
        weightKg: set.weightKg === null ? '' : String(set.weightKg),
        reps: set.reps === null ? '' : String(set.reps),
      })),
    );
  }

  addSet(): void {
    // Agrega una fila vacia al final de la tabla de fuerza.
    const current = this.sets();
    this.sets.set([...current, { setNumber: current.length + 1, weightKg: '', reps: '' }]);
  }

  removeSet(index: number): void {
    // Elimina la fila solicitada y renumera el resto.
    this.sets.set(this.sets().filter((_, i) => i !== index).map((set, i) => ({ ...set, setNumber: i + 1 })));
  }

  visibleExercises(exercises: Exercise[]): Exercise[] {
    const normalizedSearch = normalizeSearchText(this.searchTerm());
    const selectedMuscle = this.selectedMuscleGroup();

    return exercises.filter((exercise) => {
      if (normalizedSearch !== '') {
        const searchable = normalizeSearchText([exercise.name, exercise.typeLabel, ...exercise.muscleGroups].join(' '));
        if (!searchable.includes(normalizedSearch)) {
          return false;
        }
      }

      if (selectedMuscle !== null) {
        if (!exercise.muscleGroups.includes(selectedMuscle)) {
          return false;
        }
      }

      return true;
    });
  }

  buildSetsPayload(): CreateWorkoutSetPayload[] {
    // Convierte filas del grid a payload valido para backend.
    return this.sets()
      .map((set, index) => ({
        setNumber: index + 1,
        weightKg: parseOptionalNumber(set.weightKg),
        reps: parseOptionalInt(set.reps),
      }))
      .filter((set) => set.weightKg !== null || set.reps !== null);
  }

  payloadNotes(): string | null {
    // Limpia notas vacias antes de enviarlas a API.
    return normalizeOptionalString(this.notes());
  }

  canSave(): boolean {
    // Solo permite guardar si hay ejercicio y al menos una serie valida.
    return this.selectedExerciseId() !== null && this.buildSetsPayload().length > 0;
  }
}
