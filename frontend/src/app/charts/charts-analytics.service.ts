import { Injectable } from '@angular/core';
import { addDays, startOfWeekMonday, toIsoDate } from '../core/utils/date.utils';
import { ExerciseType, WorkoutSession } from '../sessions/session.model';

export type ChartPeriod = 'week' | 'month' | 'year';

export interface VolumePoint {
  x: number;
  y: number;
}

@Injectable({ providedIn: 'root' })
export class ChartsAnalyticsService {
  sessionsInRange(sessions: WorkoutSession[], period: ChartPeriod): WorkoutSession[] {
    // Delimita el conjunto de sesiones segun periodo activo del dashboard.
    const today = new Date();
    const todayIso = toIsoDate(today);

    if (period === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartIso = toIsoDate(monthStart);
      return sessions.filter((session) => session.sessionDate >= monthStartIso && session.sessionDate <= todayIso);
    }

    if (period === 'year') {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearStartIso = toIsoDate(yearStart);
      return sessions.filter((session) => session.sessionDate >= yearStartIso && session.sessionDate <= todayIso);
    }

    const weekStart = toIsoDate(startOfWeekMonday(today));
    return sessions.filter((session) => session.sessionDate >= weekStart && session.sessionDate <= todayIso);
  }

  dayMetrics(sessions: WorkoutSession[], period: ChartPeriod): Array<{ label: string; count: number }> {
    // Construye metricas agregadas segun el periodo visible.
    const today = new Date();
    const sessionsByDay = new Map<string, number>();

    this.sessionsInRange(sessions, period).forEach((session) => {
      sessionsByDay.set(session.sessionDate, (sessionsByDay.get(session.sessionDate) ?? 0) + 1);
    });

    if (period === 'month') {
      const daysInMonthToDate = today.getDate();
      return Array.from({ length: daysInMonthToDate }, (_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth(), index + 1);
        const iso = toIsoDate(date);
        return { label: String(index + 1), count: sessionsByDay.get(iso) ?? 0 };
      });
    }

    if (period === 'year') {
      const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const sessionsByMonth = new Map<number, number>();

      this.sessionsInRange(sessions, period).forEach((session) => {
        const [, month] = session.sessionDate.split('-').map(Number);
        sessionsByMonth.set(month, (sessionsByMonth.get(month) ?? 0) + 1);
      });

      return labels.slice(0, today.getMonth() + 1).map((label, index) => ({
        label,
        count: sessionsByMonth.get(index + 1) ?? 0,
      }));
    }

    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const monday = startOfWeekMonday(today);

    return labels.map((label, index) => {
      const date = addDays(monday, index);
      const iso = toIsoDate(date);
      return { label, count: sessionsByDay.get(iso) ?? 0 };
    });
  }

  typePoints(sessions: WorkoutSession[], period: ChartPeriod, type: ExerciseType): VolumePoint[] {
    // Genera puntos X/Y normalizados para la grafica de tendencia por tipo.
    const range = this.sessionsInRange(sessions, period);
    if (range.length === 0) {
      return [];
    }

    const groupedByDay = new Map<string, number>();
    range.forEach((session) => {
      const value = this.sessionTypeValue(session, type);
      groupedByDay.set(session.sessionDate, (groupedByDay.get(session.sessionDate) ?? 0) + value);
    });

    const dailyVolumes = [...groupedByDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, volume]) => volume);
    const maxVolume = Math.max(...dailyVolumes, 1);

    return dailyVolumes.map((volume, index) => {
      const x = dailyVolumes.length === 1 ? 200 : (index / (dailyVolumes.length - 1)) * 400;
      const y = 130 - (volume / maxVolume) * 100;
      return { x, y };
    });
  }

  muscleGroups(sessions: WorkoutSession[]): string[] {
    return [...new Set(sessions.flatMap((session) => session.entries).flatMap((entry) => entry.muscleGroups))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    );
  }

  musclePoints(sessions: WorkoutSession[], period: ChartPeriod, muscleGroup: string): VolumePoint[] {
    const range = this.sessionsInRange(sessions, period);
    if (range.length === 0 || muscleGroup === '') {
      return [];
    }

    const groupedByDay = new Map<string, number>();
    range.forEach((session) => {
      const value = this.sessionMuscleSetCount(session, muscleGroup);
      groupedByDay.set(session.sessionDate, (groupedByDay.get(session.sessionDate) ?? 0) + value);
    });

    const dailySets = [...groupedByDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, setCount]) => setCount);
    const maxSets = Math.max(...dailySets, 1);

    return dailySets.map((setCount, index) => {
      const x = dailySets.length === 1 ? 200 : (index / (dailySets.length - 1)) * 400;
      const y = 130 - (setCount / maxSets) * 100;
      return { x, y };
    });
  }

  periodMuscleSessionsCount(sessions: WorkoutSession[], period: ChartPeriod, muscleGroup: string): number {
    return this.sessionsInRange(sessions, period).filter((session) => session.entries.some((entry) => this.entryMatchesMuscle(entry, muscleGroup))).length;
  }

  periodMuscleSetCount(sessions: WorkoutSession[], period: ChartPeriod, muscleGroup: string): number {
    return this.sessionsInRange(sessions, period)
      .flatMap((session) => session.entries)
      .filter((entry) => this.entryMatchesMuscle(entry, muscleGroup))
      .reduce((total, entry) => total + entry.sets.length, 0);
  }

  periodMuscleStrengthVolumeKg(sessions: WorkoutSession[], period: ChartPeriod, muscleGroup: string): number {
    return this.sessionsInRange(sessions, period)
      .flatMap((session) => session.entries)
      .filter((entry) => entry.type === 'strength' && this.entryMatchesMuscle(entry, muscleGroup))
      .flatMap((entry) => entry.sets)
      .reduce((total, set) => total + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
  }

  periodMuscleDurationMinutes(sessions: WorkoutSession[], period: ChartPeriod, muscleGroup: string): number {
    const seconds = this.sessionsInRange(sessions, period)
      .flatMap((session) => session.entries)
      .filter((entry) => this.entryMatchesMuscle(entry, muscleGroup))
      .flatMap((entry) => entry.sets)
      .reduce((total, set) => total + (set.durationSeconds ?? 0), 0);

    return Math.round(seconds / 60);
  }

  periodTypeSessionsCount(sessions: WorkoutSession[], period: ChartPeriod, type: ExerciseType): number {
    // Cuenta sesiones del periodo que contienen al menos una entrada del tipo.
    return this.sessionsInRange(sessions, period).filter((session) => session.entries.some((entry) => entry.type === type)).length;
  }

  periodTypeSetCount(sessions: WorkoutSession[], period: ChartPeriod, type: ExerciseType): number {
    // Suma las series de todas las entradas del tipo.
    return this.sessionsInRange(sessions, period)
      .flatMap((session) => session.entries)
      .filter((entry) => entry.type === type)
      .reduce((total, entry) => total + entry.sets.length, 0);
  }

  periodTypeReps(sessions: WorkoutSession[], period: ChartPeriod, type: ExerciseType): number {
    // Suma repeticiones acumuladas del periodo.
    return this.sessionsInRange(sessions, period)
      .flatMap((session) => session.entries)
      .filter((entry) => entry.type === type)
      .flatMap((entry) => entry.sets)
      .reduce((total, set) => total + (set.reps ?? 0), 0);
  }

  periodTypeDurationMinutes(sessions: WorkoutSession[], period: ChartPeriod, type: ExerciseType): number {
    // Suma duracion en segundos y la expresa en minutos.
    const seconds = this.sessionsInRange(sessions, period)
      .flatMap((session) => session.entries)
      .filter((entry) => entry.type === type)
      .flatMap((entry) => entry.sets)
      .reduce((total, set) => total + (set.durationSeconds ?? 0), 0);

    return Math.round(seconds / 60);
  }

  periodTypeDistanceKm(sessions: WorkoutSession[], period: ChartPeriod, type: ExerciseType): number {
    // Suma distancia de cardio y la convierte a km.
    const distanceMeters = this.sessionsInRange(sessions, period)
      .flatMap((session) => session.entries)
      .filter((entry) => entry.type === type)
      .flatMap((entry) => entry.sets)
      .reduce((total, set) => total + (set.distanceMeters ?? 0), 0);

    return distanceMeters / 1000;
  }

  periodStrengthVolumeKg(sessions: WorkoutSession[], period: ChartPeriod): number {
    // Suma el volumen total de fuerza en el periodo.
    return this.sessionsInRange(sessions, period)
      .flatMap((session) => session.entries)
      .filter((entry) => entry.type === 'strength')
      .flatMap((entry) => entry.sets)
      .reduce((total, set) => total + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
  }

  private sessionTypeValue(session: WorkoutSession, type: ExerciseType): number {
    // Extrae la magnitud principal usada por las graficas.
    const entries = session.entries.filter((entry) => entry.type === type);

    if (type === 'strength') {
      return entries.flatMap((entry) => entry.sets).reduce((total, set) => total + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
    }

    if (type === 'cardio') {
      const totalSeconds = entries.flatMap((entry) => entry.sets).reduce((total, set) => total + (set.durationSeconds ?? 0), 0);
      return Math.round(totalSeconds / 60);
    }

    if (type === 'core') {
      return entries.flatMap((entry) => entry.sets).reduce((total, set) => total + (set.reps ?? 0), 0);
    }

    return entries.reduce((total, entry) => total + entry.sets.length, 0);
  }

  private sessionMuscleSetCount(session: WorkoutSession, muscleGroup: string): number {
    return session.entries.filter((entry) => this.entryMatchesMuscle(entry, muscleGroup)).reduce((total, entry) => total + entry.sets.length, 0);
  }

  private entryMatchesMuscle(entry: WorkoutSession['entries'][number], muscleGroup: string): boolean {
    return entry.muscleGroups.some((group) => group.toLocaleLowerCase('es') === muscleGroup.toLocaleLowerCase('es'));
  }
}
