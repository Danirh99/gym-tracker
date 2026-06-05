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
      entries: [{ id: 1, exerciseId: 1, exerciseName: 'Press', type: 'strength', typeLabel: 'Fuerza', muscleGroups: ['Pecho'], notes: null, sets: [{ setNumber: 1, weightKg: 50, reps: 2, durationSeconds: null, distanceMeters: null, speedKmh: null, incline: null, resistanceLevel: null, calories: null, notes: null }] }],
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

  it('filters sessions by week, month and year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T12:00:00.000Z'));

    const service = new ChartsAnalyticsService();
    const extendedSessions: WorkoutSession[] = [
      ...sessions,
      { ...sessions[0], id: 2, sessionDate: '2026-05-10' },
      { ...sessions[0], id: 3, sessionDate: '2026-01-15' },
      { ...sessions[0], id: 4, sessionDate: '2025-12-31' },
    ];

    expect(service.sessionsInRange(extendedSessions, 'week').map((session) => session.id)).toEqual([1]);
    expect(service.sessionsInRange(extendedSessions, 'month').map((session) => session.id)).toEqual([1, 2]);
    expect(service.sessionsInRange(extendedSessions, 'year').map((session) => session.id)).toEqual([1, 2, 3]);

    vi.useRealTimers();
  });

  it('calculates metrics by muscle group', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T12:00:00.000Z'));

    const service = new ChartsAnalyticsService();
    const mixedSessions: WorkoutSession[] = [
      ...sessions,
      {
        ...sessions[0],
        id: 2,
        entries: [{ ...sessions[0].entries[0], id: 2, exerciseName: 'Curl', muscleGroups: ['Bíceps'], sets: [{ ...sessions[0].entries[0].sets[0], weightKg: 20, reps: 10 }] }],
      },
    ];

    expect(service.muscleGroups(mixedSessions)).toEqual(['Bíceps', 'Pecho']);
    expect(service.periodMuscleSetCount(mixedSessions, 'week', 'Pecho')).toBe(1);
    expect(service.periodMuscleStrengthVolumeKg(mixedSessions, 'week', 'Bíceps')).toBe(200);
    expect(service.musclePoints(mixedSessions, 'week', 'Bíceps').length).toBe(1);

    vi.useRealTimers();
  });

  it('aggregates period metrics by selected period', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T12:00:00.000Z'));

    const service = new ChartsAnalyticsService();
    const extendedSessions: WorkoutSession[] = [
      ...sessions,
      { ...sessions[0], id: 2, sessionDate: '2026-05-10' },
      { ...sessions[0], id: 3, sessionDate: '2026-01-15' },
    ];

    expect(service.dayMetrics(extendedSessions, 'week')).toEqual([
      { label: 'L', count: 0 },
      { label: 'M', count: 1 },
      { label: 'X', count: 0 },
      { label: 'J', count: 0 },
      { label: 'V', count: 0 },
      { label: 'S', count: 0 },
      { label: 'D', count: 0 },
    ]);
    expect(service.dayMetrics(extendedSessions, 'month')[9]).toEqual({ label: '10', count: 1 });
    expect(service.dayMetrics(extendedSessions, 'month')[25]).toEqual({ label: '26', count: 1 });
    expect(service.dayMetrics(extendedSessions, 'year')).toEqual([
      { label: 'Ene', count: 1 },
      { label: 'Feb', count: 0 },
      { label: 'Mar', count: 0 },
      { label: 'Abr', count: 0 },
      { label: 'May', count: 2 },
    ]);

    vi.useRealTimers();
  });
});
