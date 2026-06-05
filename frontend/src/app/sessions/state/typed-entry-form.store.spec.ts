import { TypedEntryFormStore } from './typed-entry-form.store';
import { Exercise } from '../../exercises/exercise.model';
import { WorkoutEntry } from '../session.model';

describe('TypedEntryFormStore', () => {
  const cardioExercise: Exercise = {
    id: 1,
    name: 'Cinta',
    type: 'cardio',
    typeLabel: 'Cardio',
    muscleGroups: ['Pierna'],
    notes: null,
    icon: 'run',
    lastPerformance: '10 min',
  };

  it('builds cardio payload and supports add/remove set', () => {
    const store = new TypedEntryFormStore();
    store.initType('cardio');
    store.selectExercise(cardioExercise);

    store.cardioSets.set([{ setNumber: 1, durationMinutes: '10', distanceKm: '2', speedKmh: '', incline: '', resistanceLevel: '', calories: '' }]);

    expect(store.canSave()).toBe(true);
    const payload = store.buildSetsPayload();
    expect(payload[0]?.durationSeconds).toBe(600);
    expect(payload[0]?.distanceMeters).toBe(2000);

    store.addSet();
    expect(store.cardioSets().length).toBe(2);
    store.removeSet(1);
    expect(store.cardioSets().length).toBe(1);
  });

  it('hydrates cardio sets from an existing entry and roundtrips to seconds and meters', () => {
    const store = new TypedEntryFormStore();
    store.initType('cardio');
    const entry: WorkoutEntry = {
      id: 22,
      exerciseId: 1,
      exerciseName: 'Cinta',
      type: 'cardio',
      typeLabel: 'Cardio',
      muscleGroups: ['Pierna'],
      notes: 'Zona 2',
      sets: [
        { setNumber: 1, weightKg: null, reps: null, durationSeconds: 1500, distanceMeters: 2800, speedKmh: 6.7, incline: 3, resistanceLevel: null, calories: 120, notes: null },
      ],
    };

    store.initFromEntry(entry, cardioExercise);

    expect(store.notes()).toBe('Zona 2');
    expect(store.cardioSets()).toEqual([
      { setNumber: 1, durationMinutes: '25', distanceKm: '2.8', speedKmh: '6.7', incline: '3', resistanceLevel: '', calories: '120' },
    ]);

    const payload = store.buildSetsPayload();
    expect(payload[0]?.durationSeconds).toBe(1500);
    expect(payload[0]?.distanceMeters).toBe(2800);
    expect(payload[0]?.calories).toBe(120);
  });

  it('hydrates core/other sets from an existing entry', () => {
    const store = new TypedEntryFormStore();
    store.initType('core');
    const entry: WorkoutEntry = {
      id: 33,
      exerciseId: 3,
      exerciseName: 'Plancha',
      type: 'core',
      typeLabel: 'Abdomen',
      muscleGroups: ['Core'],
      notes: null,
      sets: [
        { setNumber: 1, weightKg: null, reps: 12, durationSeconds: 45, distanceMeters: null, speedKmh: null, incline: null, resistanceLevel: null, calories: null, notes: 'Stable' },
      ],
    };

    store.initFromEntry(entry, { ...cardioExercise, id: 3, name: 'Plancha', type: 'core' });

    expect(store.notes()).toBe('');
    expect(store.coreOtherSets()).toEqual([
      { setNumber: 1, reps: '12', durationSeconds: '45', notes: 'Stable' },
    ]);
  });
});
