import { Exercise } from '../../exercises/exercise.model';
import { WorkoutEntry } from '../session.model';
import { StrengthEntryFormStore } from './strength-entry-form.store';

function createExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 7,
    name: 'Press banca',
    type: 'strength',
    typeLabel: 'Fuerza',
    muscleGroups: ['Pecho'],
    notes: null,
    icon: 'fitness_center',
    lastPerformance: '60 kg x 8',
    ...overrides,
  };
}

function createEntry(overrides: Partial<WorkoutEntry> = {}): WorkoutEntry {
  return {
    id: 11,
    exerciseId: 7,
    exerciseName: 'Press banca',
    type: 'strength',
    typeLabel: 'Fuerza',
    muscleGroups: ['Pecho'],
    notes: 'Top set',
    sets: [
      { setNumber: 1, weightKg: 60, reps: 8, durationSeconds: null, distanceMeters: null, speedKmh: null, incline: null, resistanceLevel: null, calories: null, notes: 'Warmup' },
      { setNumber: 2, weightKg: 80, reps: 5, durationSeconds: null, distanceMeters: null, speedKmh: null, incline: null, resistanceLevel: null, calories: null, notes: null },
    ],
    ...overrides,
  };
}

describe('StrengthEntryFormStore hydration', () => {
  it('hydrates selected exercise, notes and sets from an existing entry', () => {
    const store = new StrengthEntryFormStore();
    const exercise = createExercise();
    const entry = createEntry();

    store.initFromEntry(entry, exercise);

    expect(store.selectedExerciseId()).toBe(7);
    expect(store.exerciseHistory()).toBe('60 kg x 8');
    expect(store.notes()).toBe('Top set');
    expect(store.sets()).toEqual([
      { setNumber: 1, weightKg: '60', reps: '8' },
      { setNumber: 2, weightKg: '80', reps: '5' },
    ]);
  });

  it('builds a payload that roundtrips the entry values back to numbers', () => {
    const store = new StrengthEntryFormStore();
    store.initFromEntry(createEntry(), createExercise());

    const payload = store.buildSetsPayload();

    expect(payload).toHaveLength(2);
    expect(payload[0]).toMatchObject({ setNumber: 1, weightKg: 60, reps: 8 });
    expect(payload[1]).toMatchObject({ setNumber: 2, weightKg: 80, reps: 5 });
  });

  it('normalizes blank notes to null in the payload', () => {
    const store = new StrengthEntryFormStore();
    store.initFromEntry(createEntry({ notes: '   ' }), createExercise());
    expect(store.payloadNotes()).toBeNull();
  });
});
