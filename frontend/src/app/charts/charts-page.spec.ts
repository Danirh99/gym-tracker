import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ChartsPage } from './charts-page';
import { WorkoutSession } from '../sessions/session.model';
import { WorkoutSessionsFacade } from '../sessions/state/workout-sessions.facade';

describe('ChartsPage', () => {
  const sessions: WorkoutSession[] = [
    {
      id: 1,
      name: 'Lunes fuerza',
      displayName: 'Lunes fuerza',
      sessionDate: '2026-05-25',
      mood: null,
      moodLabel: null,
      notes: null,
      startedAt: null,
      finishedAt: null,
      exerciseCount: 1,
      setCount: 2,
      totalVolumeKg: 1000,
      cardioDurationSeconds: 600,
      entries: [
        {
          id: 11,
          exerciseId: 1,
          exerciseName: 'Cinta',
          type: 'cardio',
          typeLabel: 'Cardio',
          notes: null,
          sets: [
            {
              setNumber: 1,
              weightKg: null,
              reps: null,
              durationSeconds: 600,
              distanceMeters: 2500,
              speedKmh: null,
              incline: null,
              resistanceLevel: null,
              calories: null,
              notes: null,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Martes fuerza',
      displayName: 'Martes fuerza',
      sessionDate: '2026-05-26',
      mood: null,
      moodLabel: null,
      notes: null,
      startedAt: null,
      finishedAt: null,
      exerciseCount: 1,
      setCount: 3,
      totalVolumeKg: 2000,
      cardioDurationSeconds: 300,
      entries: [
        {
          id: 12,
          exerciseId: 2,
          exerciseName: 'Remo',
          type: 'cardio',
          typeLabel: 'Cardio',
          notes: null,
          sets: [
            {
              setNumber: 1,
              weightKg: null,
              reps: null,
              durationSeconds: 300,
              distanceMeters: 1500,
              speedKmh: null,
              incline: null,
              resistanceLevel: null,
              calories: null,
              notes: null,
            },
          ],
        },
      ],
    },
  ];

  function setup(serviceReturn = of({ items: sessions })) {
    const workoutSessionsFacadeSpy = {
      all: vi.fn().mockReturnValue(serviceReturn),
    };

    TestBed.configureTestingModule({
      imports: [ChartsPage],
      providers: [provideRouter([]), { provide: WorkoutSessionsFacade, useValue: workoutSessionsFacadeSpy }],
    });

    const fixture = TestBed.createComponent(ChartsPage);
    const component = fixture.componentInstance;

    return { fixture, component, workoutSessionsFacadeSpy };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads all sessions on init', () => {
    const { fixture, component, workoutSessionsFacadeSpy } = setup();

    fixture.detectChanges();

    expect(workoutSessionsFacadeSpy.all).toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.sessions.length).toBe(2);
  });

  it('calculates weekly metrics correctly', () => {
    const { fixture, component } = setup();

    fixture.detectChanges();
    component.selectType('cardio');

    expect(component.weeklySessionCount()).toBe(2);
    expect(component.periodSessionsCount()).toBe(2);
    expect(component.periodCardioMinutes()).toBe(15);
    expect(component.periodDistanceKm()).toBeCloseTo(4.0, 5);
    expect(component.periodVolumeKg()).toBe(0);
  });

  it('returns chart paths with loaded data', () => {
    const { fixture, component } = setup();

    fixture.detectChanges();

    const linePath = component.volumePath();
    const areaPath = component.volumeAreaPath();

    expect(linePath).toContain('M');
    expect(linePath).toContain('L');
    expect(areaPath.endsWith('Z')).toBe(true);
  });

  it('handles error when sessions loading fails', () => {
    const { fixture, component } = setup(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
    expect(component.sessions).toEqual([]);
    expect(component.errorMessage).toBe('No se han podido cargar los datos de las gráficas.');
  });

  it('computes trend and record message for selected period', () => {
    const { fixture, component } = setup();

    fixture.detectChanges();

    component.selectPeriod('week');
    component.selectType('cardio');

    expect(component.volumeTrendPercent()).toBe(167);
    expect(component.recordMessage()).toContain('Nuevo pico');
  });
});
