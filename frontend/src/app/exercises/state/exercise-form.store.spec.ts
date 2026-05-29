import { ExerciseFormStore } from './exercise-form.store';

describe('ExerciseFormStore', () => {
  it('builds normalized payload', () => {
    const store = new ExerciseFormStore();
    store.form.setValue({
      name: '  Press banca  ',
      type: 'strength',
      muscleGroups: 'Pecho, Triceps, Pecho',
      notes: '  notas  ',
    });

    const payload = store.toPayload();
    expect(payload.name).toBe('Press banca');
    expect(payload.muscleGroups).toEqual(['Pecho', 'Triceps']);
    expect(payload.notes).toBe('notas');
  });
});
