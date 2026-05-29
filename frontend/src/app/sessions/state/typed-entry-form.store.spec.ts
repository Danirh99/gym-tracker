import { TypedEntryFormStore } from './typed-entry-form.store';
import { Exercise } from '../../exercises/exercise.model';

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
});
