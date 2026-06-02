import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { addDays, startOfWeekMonday, toIsoDate } from '../core/utils/date.utils';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';
import { WorkoutSession } from '../sessions/session.model';
import { WorkoutSessionsFacade } from '../sessions/state/workout-sessions.facade';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ThemeToggleButtonComponent],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  recentSessions: WorkoutSession[] = [];
  allSessions: WorkoutSession[] = [];
  isLoadingSessions = true;
  sessionsErrorMessage: string | null = null;
  weeklySessionCountValue = 0;
  weeklyDurationLabelValue = '0m';
  weeklyExerciseCountValue = 0;
  weeklyVolumeLabelValue = '0 kg';
  weeklyStreakDaysValue = 0;
  weeklyAvgVolumePerSessionLabelValue = '0 kg';

  constructor(
    private readonly workoutSessionsFacade: WorkoutSessionsFacade,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Carga una version ligera del historial y deriva los indicadores de inicio.
    this.loadSessionSummaries();
  }

  loadSessionSummaries(): void {
    // Trae el historial resumido sin duplicar peticiones ni descargar series completas.
    this.isLoadingSessions = true;
    this.sessionsErrorMessage = null;

    this.workoutSessionsFacade
      .summaries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          this.allSessions = items;
          this.recentSessions = items.slice(0, 3);
          this.recomputeWeeklySummary();
          this.isLoadingSessions = false;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.sessionsErrorMessage = 'No se han podido cargar los entrenamientos.';
          this.allSessions = [];
          this.recentSessions = [];
          this.recomputeWeeklySummary();
          this.isLoadingSessions = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  sessionDateLabel(session: WorkoutSession): string {
    // Resalta hoy y ayer con etiquetas cortas.
    const [year, month, day] = session.sessionDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }

    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(date);
  }

  sessionMeta(session: WorkoutSession): string {
    // Compone metadatos resumidos para el listado.
    const parts = [`${session.exerciseCount} ejercicios`, `${session.setCount} series`];

    if (session.moodLabel !== null) {
      parts.push(session.moodLabel);
    }

    return parts.join(' · ');
  }

  private weekSessions(): WorkoutSession[] {
    // Filtra las sesiones dentro del rango semanal visible.
    const today = new Date();
    const todayIso = toIsoDate(today);
    const weekStartIso = toIsoDate(startOfWeekMonday(today));
    return this.allSessions.filter((session) => session.sessionDate >= weekStartIso && session.sessionDate <= todayIso);
  }

  private recomputeWeeklySummary(): void {
    // Mantiene el template libre de filtros y reducciones repetidas.
    const sessions = this.weekSessions();
    const totalMinutes = sessions.reduce((total, session) => total + this.sessionDurationMinutes(session), 0);
    const totalVolume = sessions.reduce((total, session) => total + session.totalVolumeKg, 0);

    this.weeklySessionCountValue = sessions.length;
    this.weeklyDurationLabelValue = this.formatMinutes(totalMinutes);
    this.weeklyExerciseCountValue = sessions.reduce((total, session) => total + session.exerciseCount, 0);
    this.weeklyVolumeLabelValue = `${this.formatNumber(totalVolume)} kg`;
    this.weeklyStreakDaysValue = this.computeWeeklyStreakDays(sessions);
    this.weeklyAvgVolumePerSessionLabelValue = sessions.length === 0 ? '0 kg' : `${this.formatNumber(totalVolume / sessions.length)} kg`;
  }

  private computeWeeklyStreakDays(sessions: WorkoutSession[]): number {
    // Cuenta racha consecutiva desde hoy hacia atras.
    const today = new Date();
    const monday = startOfWeekMonday(today);
    const dates = new Set(sessions.map((session) => session.sessionDate));
    let streak = 0;

    for (let cursor = new Date(today); cursor >= monday; cursor = addDays(cursor, -1)) {
      const iso = toIsoDate(cursor);
      if (!dates.has(iso)) {
        break;
      }

      streak += 1;
    }

    return streak;
  }

  private sessionDurationMinutes(session: WorkoutSession): number {
    // Prioriza rango horario registrado y cae a cardio si no existe.
    if (session.startedAt !== null && session.finishedAt !== null) {
      const startedAt = new Date(session.startedAt);
      const finishedAt = new Date(session.finishedAt);
      const minutes = Math.round((finishedAt.getTime() - startedAt.getTime()) / 60000);
      if (minutes > 0) {
        return minutes;
      }
    }

    return Math.round(session.cardioDurationSeconds / 60);
  }

  private formatMinutes(totalMinutes: number): string {
    // Serializa minutos acumulados como horas y minutos.
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes}m`;
    }

    return `${hours}h ${minutes}m`;
  }

  private formatNumber(value: number): string {
    // Aplica formato numerico local al panel.
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
  }

}
