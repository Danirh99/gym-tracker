import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { RouterLink } from '@angular/router';
import { todayIsoDate } from '../core/utils/date.utils';
import { formatNumberEs } from '../core/utils/format.utils';
import { Exercise } from '../exercises/exercise.model';
import { ExercisesFacade } from '../exercises/state/exercises.facade';
import { WorkoutSession } from '../sessions/session.model';
import { WorkoutSessionsFacade } from '../sessions/state/workout-sessions.facade';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';

type AlertTone = 'critical' | 'warning' | 'info';

interface AlertItem {
  title: string;
  description: string;
  tone: AlertTone;
  icon: string;
  ctaLabel: string;
  ctaLink: string;
}

@Component({
  selector: 'app-alerts-page',
  imports: [RouterLink, ThemeToggleButtonComponent, BottomNavComponent],
  templateUrl: './alerts-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsPage implements OnInit {
  readonly forgottenExerciseDays = 21;
  readonly streakRiskDays = 3;
  readonly imbalanceWindowDays = 28;

  isLoading = true;
  errorMessage: string | null = null;
  alerts: AlertItem[] = [];

  constructor(
    private readonly sessionsFacade: WorkoutSessionsFacade,
    private readonly exercisesFacade: ExercisesFacade,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      sessions: this.sessionsFacade.all(),
      exercises: this.exercisesFacade.list(),
    }).subscribe({
      next: ({ sessions, exercises }) => {
        this.alerts = this.buildAlerts(sessions.items, exercises.items);
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se han podido calcular las alertas.';
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  criticalAlerts(): AlertItem[] {
    return this.alerts.filter((alert) => alert.tone === 'critical');
  }

  warningAlerts(): AlertItem[] {
    return this.alerts.filter((alert) => alert.tone === 'warning');
  }

  infoAlerts(): AlertItem[] {
    return this.alerts.filter((alert) => alert.tone === 'info');
  }

  totalAlertCountLabel(): string {
    return formatNumberEs(this.alerts.length);
  }

  private buildAlerts(sessions: WorkoutSession[], exercises: Exercise[]): AlertItem[] {
    const alerts: AlertItem[] = [];
    const lastSessionDate = this.findLastSessionDate(sessions);
    const streakDaysWithoutTraining = this.daysBetweenIsoDates(lastSessionDate, todayIsoDate());

    if (streakDaysWithoutTraining > this.streakRiskDays) {
      alerts.push({
        title: 'Racha en riesgo',
        description: `Llevas ${streakDaysWithoutTraining} dias sin entrenar. Intenta registrar una sesion corta hoy.`,
        tone: 'critical',
        icon: 'local_fire_department',
        ctaLabel: 'Crear sesion',
        ctaLink: '/sessions/new',
      });
    }

    const forgottenExercises = this.findForgottenExercises(sessions, exercises);
    if (forgottenExercises.length > 0) {
      alerts.push({
        title: 'Ejercicios olvidados',
        description: `${forgottenExercises.length} ejercicios llevan mas de ${this.forgottenExerciseDays} dias sin registrarse.`,
        tone: 'warning',
        icon: 'history',
        ctaLabel: 'Ver ejercicios',
        ctaLink: '/exercises',
      });
    }

    const imbalanceAlert = this.buildImbalanceAlert(sessions);
    if (imbalanceAlert !== null) {
      alerts.push(imbalanceAlert);
    }

    if (alerts.length === 0) {
      alerts.push({
        title: 'Todo al dia',
        description: 'No hay alertas activas. Mantienes una buena regularidad en tus entrenamientos.',
        tone: 'info',
        icon: 'verified',
        ctaLabel: 'Ver graficas',
        ctaLink: '/charts',
      });
    }

    return alerts;
  }

  private findForgottenExercises(sessions: WorkoutSession[], exercises: Exercise[]): Exercise[] {
    const lastByExerciseName = new Map<string, string>();

    for (const session of sessions) {
      for (const entry of session.entries) {
        const key = this.normalizeExerciseName(entry.exerciseName);
        const knownDate = lastByExerciseName.get(key);
        if (knownDate === undefined || session.sessionDate > knownDate) {
          lastByExerciseName.set(key, session.sessionDate);
        }
      }
    }

    return exercises.filter((exercise) => {
      const lastDate = lastByExerciseName.get(this.normalizeExerciseName(exercise.name));

      if (lastDate === undefined) {
        return false;
      }

      return this.daysBetweenIsoDates(lastDate, todayIsoDate()) > this.forgottenExerciseDays;
    });
  }

  private buildImbalanceAlert(sessions: WorkoutSession[]): AlertItem | null {
    const fromIso = this.isoDateDaysAgo(this.imbalanceWindowDays);
    const counts = { strength: 0, cardio: 0, core: 0, other: 0 };

    for (const session of sessions) {
      if (session.sessionDate < fromIso) {
        continue;
      }

      for (const entry of session.entries) {
        counts[entry.type] += 1;
      }
    }

    const values = Object.values(counts);
    const total = values.reduce((acc, value) => acc + value, 0);
    if (total < 8) {
      return null;
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    if (maxValue === 0 || minValue / maxValue >= 0.35) {
      return null;
    }

    const weakestType = Object.entries(counts).sort((a, b) => a[1] - b[1])[0][0];

    return {
      title: 'Desbalance de tipos',
      description: `En los ultimos ${this.imbalanceWindowDays} dias casi no trabajaste ${this.typeLabel(weakestType)}.`,
      tone: 'warning',
      icon: 'balance',
      ctaLabel: 'Ir a calendario',
      ctaLink: '/calendar',
    };
  }

  private findLastSessionDate(sessions: WorkoutSession[]): string {
    if (sessions.length === 0) {
      return todayIsoDate();
    }

    return sessions.reduce((latest, session) => (session.sessionDate > latest ? session.sessionDate : latest), sessions[0].sessionDate);
  }

  private typeLabel(type: string): string {
    if (type === 'strength') {
      return 'fuerza';
    }
    if (type === 'cardio') {
      return 'cardio';
    }
    if (type === 'core') {
      return 'core';
    }

    return 'otros ejercicios';
  }

  private isoDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }

  private daysBetweenIsoDates(fromIso: string, toIso: string): number {
    const from = new Date(`${fromIso}T00:00:00`);
    const to = new Date(`${toIso}T00:00:00`);
    return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000));
  }

  private normalizeExerciseName(value: string): string {
    return value.trim().toLocaleLowerCase('es-ES');
  }
}
