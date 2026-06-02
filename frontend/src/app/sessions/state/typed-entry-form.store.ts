import { Injectable, signal } from '@angular/core';
import { parseOptionalInt, parseOptionalNumber } from '../../core/utils/number.utils';
import { normalizeOptionalString, normalizeSearchText } from '../../core/utils/string.utils';
import { Exercise } from '../../exercises/exercise.model';
import { CreateWorkoutSetPayload, WorkoutEntry } from '../session.model';
import { cardioSetToRow, coreOtherSetToRow } from '../sets-mapping';
import { CardioSetRow } from '../ui/cardio-sets-table.component';
import { CoreOtherSetRow } from '../ui/core-other-sets-table.component';

export type SupportedType = 'cardio' | 'core' | 'other';

@Injectable()
export class TypedEntryFormStore {
  /** Tipo de formulario activo (cardio/core/other). */
  readonly type = signal<SupportedType>('cardio');

  /** Texto libre para filtrar ejercicios en lista. */
  readonly searchTerm = signal('');

  /** Notas generales de la entrada agregada a la sesion. */
  readonly notes = signal('');

  /** Ejercicio seleccionado para crear la entrada. */
  readonly selectedExerciseId = signal<number | null>(null);

  /** Ultimo rendimiento mostrado como ayuda contextual. */
  readonly selectedExerciseHistory = signal<string | null>(null);

  /** Filas editables para captura de bloques cardio. */
  readonly cardioSets = signal<CardioSetRow[]>([
    { setNumber: 1, durationMinutes: '25', distanceKm: '2.8', speedKmh: '6.7', incline: '3', resistanceLevel: '', calories: '' },
  ]);

  /** Filas editables para captura de sets core/other. */
  readonly coreOtherSets = signal<CoreOtherSetRow[]>([
    { setNumber: 1, reps: '12', durationSeconds: '', notes: '' },
    { setNumber: 2, reps: '10', durationSeconds: '', notes: '' },
    { setNumber: 3, reps: '8', durationSeconds: '', notes: '' },
  ]);

  initType(type: SupportedType): void {
    // Inicializa el modo de formulario segun la ruta.
    this.type.set(type);
  }

  selectExercise(exercise: Exercise): void {
    // Guarda ejercicio y contexto de rendimiento previo.
    this.selectedExerciseId.set(exercise.id);
    this.selectedExerciseHistory.set(exercise.lastPerformance);
  }

  initFromEntry(entry: WorkoutEntry, exercise: Exercise): void {
    // Hidrata el formulario desde una entrada existente para soportar edicion.
    this.selectedExerciseId.set(exercise.id);
    this.selectedExerciseHistory.set(exercise.lastPerformance);
    this.notes.set(entry.notes ?? '');

    if (this.type() === 'cardio') {
      this.cardioSets.set(entry.sets.map((set, index) => cardioSetToRow(set, index)));
      return;
    }

    this.coreOtherSets.set(entry.sets.map((set, index) => coreOtherSetToRow(set, index)));
  }

  addSet(): void {
    // Anade una fila nueva segun el tipo activo.
    if (this.type() === 'cardio') {
      const current = this.cardioSets();
      this.cardioSets.set([
        ...current,
        { setNumber: current.length + 1, durationMinutes: '', distanceKm: '', speedKmh: '', incline: '', resistanceLevel: '', calories: '' },
      ]);
      return;
    }

    const current = this.coreOtherSets();
    this.coreOtherSets.set([...current, { setNumber: current.length + 1, reps: '', durationSeconds: '', notes: '' }]);
  }

  removeSet(index: number): void {
    // Elimina y renumera filas manteniendo la coherencia visual.
    if (this.type() === 'cardio') {
      this.cardioSets.set(this.cardioSets().filter((_, i) => i !== index).map((set, i) => ({ ...set, setNumber: i + 1 })));
      return;
    }

    this.coreOtherSets.set(this.coreOtherSets().filter((_, i) => i !== index).map((set, i) => ({ ...set, setNumber: i + 1 })));
  }

  visibleExercises(exercises: Exercise[]): Exercise[] {
    // Filtra por texto normalizado para tolerar tildes/mayusculas.
    const normalizedSearch = normalizeSearchText(this.searchTerm());

    return exercises.filter((exercise) => {
      if (normalizedSearch === '') {
        return true;
      }

      const searchable = normalizeSearchText([exercise.name, exercise.typeLabel, ...exercise.muscleGroups].join(' '));
      return searchable.includes(normalizedSearch);
    });
  }

  buildSetsPayload(): CreateWorkoutSetPayload[] {
    // Serializa filas del formulario al formato requerido por API.
    if (this.type() === 'cardio') {
      return this.cardioSets()
        .map((set, index) => {
          const durationMinutes = parseOptionalNumber(set.durationMinutes);
          const durationSeconds = durationMinutes === null ? null : Math.round(durationMinutes * 60);
          const distanceKm = parseOptionalNumber(set.distanceKm);

          return {
            setNumber: index + 1,
            weightKg: null,
            reps: null,
            durationSeconds,
            distanceMeters: distanceKm === null ? null : distanceKm * 1000,
            speedKmh: parseOptionalNumber(set.speedKmh),
            incline: parseOptionalNumber(set.incline),
            resistanceLevel: parseOptionalInt(set.resistanceLevel),
            calories: parseOptionalInt(set.calories),
          };
        })
        .filter((set) => set.durationSeconds !== null || set.distanceMeters !== null);
    }

    return this.coreOtherSets()
      .map((set, index) => ({
        setNumber: index + 1,
        weightKg: null,
        reps: parseOptionalInt(set.reps),
        durationSeconds: parseOptionalInt(set.durationSeconds),
        notes: normalizeOptionalString(set.notes),
      }))
      .filter((set) => set.reps !== null || set.durationSeconds !== null);
  }

  payloadNotes(): string | null {
    // Normaliza notas vacias a null.
    return normalizeOptionalString(this.notes());
  }

  canSave(): boolean {
    // Valida ejercicio y datos suficientes para persistir.
    return this.selectedExerciseId() !== null && this.buildSetsPayload().length > 0;
  }
}
