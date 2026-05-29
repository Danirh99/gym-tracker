import { ChartsAnalyticsService } from './charts-analytics.service';
import { WorkoutSession } from '../sessions/session.model';
import { vi } from 'vitest';

describe('ChartsAnalyticsService', () => {
  const sessions: WorkoutSession[] = [
    {
      id: 1,
      name: null,
      displayName: 'S1',
      sessionDate: '2026-05-26',
      mood: null,
      moodLabel: null,
      notes: null,
      startedAt: null,
      finishedAt: null,
      exerciseCount: 1,
      setCount: 1,
      totalVolumeKg: 100,
      cardioDurationSeconds: 120,
      entries: [{ id: 1, exerciseName: 'Press', type: 'strength', typeLabel: 'Fuerza', notes: null, sets: [{ setNumber: 1, weightKg: 50, reps: 2, durationSeconds: null, distanceMeters: null, speedKmh: null, incline: null, resistanceLevel: null, calories: null, notes: null }] }],
    },
  ];

  it('calculates strength volume and type points', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T12:00:00.000Z'));

    const service = new ChartsAnalyticsService();
    expect(service.periodStrengthVolumeKg(sessions, 'week')).toBe(100);
    expect(service.typePoints(sessions, 'week', 'strength').length).toBe(1);

    vi.useRealTimers();
  });
});
