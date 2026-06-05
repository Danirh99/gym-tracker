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
          muscleGroups: ['Pierna'],
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
          muscleGroups: ['Pierna'],
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
    component.selectMuscleGroup('Pierna');

    expect(component.weeklySessionCountValue).toBe(2);
    expect(component.periodSessionsCountValue).toBe(2);
    expect(component.selectedTypeTotalLabelValue).toBe('2 series');
    expect(component.selectedTypeStatCardsValue[2].value).toBe('15 min');
  });

  it('returns chart paths with loaded data', () => {
    const { fixture, component } = setup();

    fixture.detectChanges();

    const linePath = component.typePathValue;
    const areaPath = component.typeAreaPathValue;

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
    component.selectMuscleGroup('Pierna');

    expect(component.typeTrendPercentValue).toBe(0);
    expect(component.recordMessageValue).toContain('Nuevo pico');
  });

  it('selects available muscle groups from loaded sessions', () => {
    const extendedSessions: WorkoutSession[] = [
      ...sessions,
      {
        ...sessions[0],
        id: 3,
        entries: [{ ...sessions[0].entries[0], id: 13, exerciseName: 'Curl', muscleGroups: ['Bíceps'] }],
      },
    ];
    const { fixture, component } = setup(of({ items: extendedSessions }));

    fixture.detectChanges();

    expect(component.muscleButtons).toEqual([
      { value: 'Bíceps', label: 'Bíceps' },
      { value: 'Pierna', label: 'Pierna' },
    ]);

    component.selectMuscleGroup('Bíceps');

    expect(component.selectedTypeTitleValue).toBe('Trabajo de Bíceps');
    expect(component.selectedTypeTotalLabelValue).toBe('1 series');
  });

  it('filters session chart by month and year', () => {
    const extendedSessions: WorkoutSession[] = [
      ...sessions,
      { ...sessions[0], id: 3, sessionDate: '2026-05-10', displayName: 'Mayo anterior' },
      { ...sessions[0], id: 4, sessionDate: '2026-01-15', displayName: 'Enero' },
      { ...sessions[0], id: 5, sessionDate: '2025-12-31', displayName: 'Año anterior' },
    ];
    const { fixture, component } = setup(of({ items: extendedSessions }));

    fixture.detectChanges();

    component.selectPeriod('month');

    expect(component.weeklySessionCountValue).toBe(3);
    expect(component.periodSessionChartTitleValue).toBe('Sesiones este mes');
    expect(component.periodSessionCountLabelValue).toBe('3 sesiones este mes');
    expect(component.dayMetricsValue.length).toBe(27);

    component.selectPeriod('year');

    expect(component.weeklySessionCountValue).toBe(4);
    expect(component.periodSessionChartTitleValue).toBe('Sesiones este año');
    expect(component.periodSessionCountLabelValue).toBe('4 sesiones este año');
    expect(component.dayMetricsValue).toEqual([
      { label: 'Ene', count: 1 },
      { label: 'Feb', count: 0 },
      { label: 'Mar', count: 0 },
      { label: 'Abr', count: 0 },
      { label: 'May', count: 3 },
    ]);
  });
});
