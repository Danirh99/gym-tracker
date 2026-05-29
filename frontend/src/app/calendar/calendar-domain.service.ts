import { Injectable } from '@angular/core';
import { toIsoDate } from '../core/utils/date.utils';
import { WorkoutSession } from '../sessions/session.model';

export interface CalendarDay {
  iso: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  sessions: WorkoutSession[];
}

@Injectable({ providedIn: 'root' })
export class CalendarDomainService {
  groupSessionsByDay(sessions: WorkoutSession[]): Map<string, WorkoutSession[]> {
    // Agrupa las sesiones por dia ISO para pintarlas en calendario.
    const grouped = new Map<string, WorkoutSession[]>();

    sessions.forEach((session) => {
      const existing = grouped.get(session.sessionDate) ?? [];
      existing.push(session);
      existing.sort((a, b) => b.id - a.id);
      grouped.set(session.sessionDate, existing);
    });

    return grouped;
  }

  buildMonthDays(monthDate: Date, sessionsByDay: Map<string, WorkoutSession[]>): CalendarDay[] {
    // Genera la grilla de 6 semanas del mes visible.
    const days: CalendarDay[] = [];
    const start = this.startCalendarGrid(monthDate);
    const todayIso = toIsoDate(new Date());

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const iso = toIsoDate(date);

      days.push({
        iso,
        day: date.getDate(),
        inCurrentMonth: date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear(),
        isToday: iso === todayIso,
        sessions: sessionsByDay.get(iso) ?? [],
      });
    }

    return days;
  }

  pickSelectedDayIso(days: CalendarDay[], previousSelection: string | null): string | null {
    // Intenta conservar la seleccion actual al navegar entre meses.
    if (previousSelection !== null && days.some((day) => day.iso === previousSelection)) {
      return previousSelection;
    }

    const today = days.find((day) => day.isToday && day.inCurrentMonth);
    if (today !== undefined) {
      return today.iso;
    }

    return days.find((day) => day.inCurrentMonth)?.iso ?? null;
  }

  startOfMonth(date: Date): Date {
    // Reduce una fecha al primer dia de su mes.
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private startCalendarGrid(monthDate: Date): Date {
    // Ajusta el calendario para que comience en lunes.
    const firstDay = this.startOfMonth(monthDate);
    const dayOfWeek = firstDay.getDay();
    const mondayFirstOffset = (dayOfWeek + 6) % 7;

    return new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() - mondayFirstOffset);
  }
}
