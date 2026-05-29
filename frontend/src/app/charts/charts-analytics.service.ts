import { Injectable } from '@angular/core';
import { addDays, startOfWeekMonday, toIsoDate } from '../core/utils/date.utils';
import { ExerciseType, WorkoutSession } from '../sessions/session.model';

export type ChartPeriod = 'week' | 'month' | 'all';

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

    if (period === 'all') {
      return sessions;
    }

    if (period === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartIso = toIsoDate(monthStart);
      return sessions.filter((session) => session.sessionDate >= monthStartIso && session.sessionDate <= todayIso);
    }

    const weekStart = toIsoDate(startOfWeekMonday(today));
    return sessions.filter((session) => session.sessionDate >= weekStart && session.sessionDate <= todayIso);
  }

  dayMetrics(sessions: WorkoutSession[], period: ChartPeriod): Array<{ label: string; count: number }> {
    // Construye metrica semanal agregando sesiones por dia calendario.
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const monday = startOfWeekMonday(new Date());
    const sessionsByDay = new Map<string, number>();

    this.sessionsInRange(sessions, period).forEach((session) => {
      sessionsByDay.set(session.sessionDate, (sessionsByDay.get(session.sessionDate) ?? 0) + 1);
    });

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
}
