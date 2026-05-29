import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { addDays, startOfWeekMonday, toIsoDate } from '../core/utils/date.utils';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';
import { WorkoutSession } from '../sessions/session.model';
import { WorkoutSessionsFacade } from '../sessions/state/workout-sessions.facade';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ThemeToggleButtonComponent, BottomNavComponent],
  templateUrl: './home-page.html',
})
export class HomePage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  recentSessions: WorkoutSession[] = [];
  allSessions: WorkoutSession[] = [];
  isLoadingSessions = true;
  sessionsErrorMessage: string | null = null;

  constructor(
    private readonly workoutSessionsFacade: WorkoutSessionsFacade,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Carga el resumen de inicio en paralelo.
    this.loadRecentSessions();
    this.loadAllSessions();
  }

  loadRecentSessions(): void {
    // Trae las ultimas sesiones para la tarjeta destacada.
    this.isLoadingSessions = true;
    this.sessionsErrorMessage = null;

    this.workoutSessionsFacade
      .recent(3)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          this.recentSessions = items;
          this.isLoadingSessions = false;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.sessionsErrorMessage = 'No se han podido cargar los entrenamientos.';
          this.isLoadingSessions = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  loadAllSessions(): void {
    // Carga todo el historial para calcular los indicadores semanales.
    this.workoutSessionsFacade
      .all()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          this.allSessions = items;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.allSessions = [];
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  weeklySessionCount(): number {
    // Total de sesiones dentro de la semana actual.
    return this.weekSessions().length;
  }

  weeklyDurationLabel(): string {
    // Suma duraciones y devuelve una etiqueta compacta.
    const totalMinutes = this.weekSessions().reduce((total, session) => total + this.sessionDurationMinutes(session), 0);
    return this.formatMinutes(totalMinutes);
  }

  weeklyExerciseCount(): number {
    return this.weekSessions().reduce((total, session) => total + session.exerciseCount, 0);
  }

  weeklyVolumeLabel(): string {
    const totalVolume = this.weekSessions().reduce((total, session) => total + session.totalVolumeKg, 0);
    return `${this.formatNumber(totalVolume)} kg`;
  }

  weeklyStreakDays(): number {
    // Cuenta racha consecutiva desde hoy hacia atras.
    const today = new Date();
    const monday = startOfWeekMonday(today);
    const dates = new Set(this.weekSessions().map((session) => session.sessionDate));
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

  weeklyAvgVolumePerSessionLabel(): string {
    // Calcula el promedio de volumen por sesion en la semana.
    const sessions = this.weekSessions();
    if (sessions.length === 0) {
      return '0 kg';
    }

    const totalVolume = sessions.reduce((total, session) => total + session.totalVolumeKg, 0);
    return `${this.formatNumber(totalVolume / sessions.length)} kg`;
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
