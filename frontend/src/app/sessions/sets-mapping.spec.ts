import { WorkoutSet } from './session.model';
import { cardioSetToRow, coreOtherSetToRow, strengthSetToRow } from './sets-mapping';

function createSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    setNumber: 1,
    weightKg: null,
    reps: null,
    durationSeconds: null,
    distanceMeters: null,
    speedKmh: null,
    incline: null,
    resistanceLevel: null,
    calories: null,
    notes: null,
    ...overrides,
  };
}

describe('sets-mapping', () => {
  it('maps a strength set into a form row keeping weight and reps', () => {
    const row = strengthSetToRow(createSet({ weightKg: 50, reps: 8, setNumber: 1 }), 0);

    expect(row).toEqual({ setNumber: 1, weightKg: '50', reps: '8' });
  });

  it('maps a strength set with null values to empty strings', () => {
    const row = strengthSetToRow(createSet(), 0);

    expect(row).toEqual({ setNumber: 1, weightKg: '', reps: '' });
  });

  it('maps a cardio set converting seconds to minutes and meters to km', () => {
    const row = cardioSetToRow(
      createSet({
        durationSeconds: 1500,
        distanceMeters: 2800,
        speedKmh: 6.7,
        incline: 3,
        resistanceLevel: 5,
        calories: 120,
      }),
      0,
    );

    expect(row.durationMinutes).toBe('25');
    expect(row.distanceKm).toBe('2.8');
    expect(row.speedKmh).toBe('6.7');
    expect(row.incline).toBe('3');
    expect(row.resistanceLevel).toBe('5');
    expect(row.calories).toBe('120');
  });

  it('maps a cardio set with null metrics to empty fields', () => {
    const row = cardioSetToRow(createSet(), 0);

    expect(row).toEqual({
      setNumber: 1,
      durationMinutes: '',
      distanceKm: '',
      speedKmh: '',
      incline: '',
      resistanceLevel: '',
      calories: '',
    });
  });

  it('maps a core/other set keeping reps, duration and notes', () => {
    const row = coreOtherSetToRow(createSet({ reps: 12, durationSeconds: 45, notes: 'Stable' }), 0);

    expect(row).toEqual({ setNumber: 1, reps: '12', durationSeconds: '45', notes: 'Stable' });
  });

  it('maps a core/other set with null values to empty fields', () => {
    const row = coreOtherSetToRow(createSet({ notes: null }), 0);

    expect(row).toEqual({ setNumber: 1, reps: '', durationSeconds: '', notes: '' });
  });
});
