import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatDurationFromSeconds, formatNumberEs, formatSessionDateEs } from '../core/utils/format.utils';
import { DurationPipe } from '../shared/pipes/duration.pipe';
import { NumberEsPipe } from '../shared/pipes/number-es.pipe';
import { SessionDatePipe } from '../shared/pipes/session-date.pipe';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';
import { ExerciseProgressEntry, ExerciseProgressResponse, ExerciseRecommendationAction, ExerciseType } from './exercise.model';
import { ExerciseProgressDomainService } from './exercise-progress-domain.service';
import { ExercisesFacade } from './state/exercises.facade';

@Component({
  selector: 'app-exercise-detail-page',
  imports: [DurationPipe, NgClass, NumberEsPipe, RouterLink, SessionDatePipe, ThemeToggleButtonComponent],
  templateUrl: './exercise-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseDetailPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  progress: ExerciseProgressResponse | null = null;
  expandedEntryId: number | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly exercisesFacade: ExercisesFacade,
    private readonly exerciseProgressDomainService: ExerciseProgressDomainService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Valida la ruta y dispara la carga del progreso.
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.isLoading = false;
      this.errorMessage = 'El ejercicio solicitado no es válido.';
      return;
    }

    this.exercisesFacade
      .progress(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.progress = response;
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No se ha podido cargar la evolución del ejercicio.';
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  badgeClass(type: ExerciseType): string {
    // Asigna una tonalidad visual por tipo de ejercicio.
    if (type === 'cardio') {
      return 'bg-secondary/15 text-secondary';
    }

    if (type === 'core') {
      return 'bg-tertiary-container/40 text-tertiary';
    }

    if (type === 'other') {
      return 'bg-surface-container-high text-on-surface-variant';
    }

    return 'bg-primary/15 text-primary';
  }

  formatDate(value: string): string {
    // Expone el helper de fecha para templates.
    return formatSessionDateEs(value);
  }

  formatNumber(value: number, maxFractionDigits = 0): string {
    return formatNumberEs(value, maxFractionDigits);
  }

  formatDuration(seconds: number): string {
    return formatDurationFromSeconds(seconds);
  }

  formatSetLine(entry: ExerciseProgressEntry): string {
    // Resume el mejor dato de la serie para el listado.
    if (entry.topSet !== null) {
      return entry.topSet;
    }

    if (entry.durationSeconds > 0) {
      return this.formatDuration(entry.durationSeconds);
    }

    return 'Sin top set';
  }

  trendLabel(index: number): string {
    // Calcula la tendencia relativa entre entradas consecutivas.
    return this.exerciseProgressDomainService.trendLabel(this.progress?.items ?? [], index, this.formatNumber.bind(this), this.formatDuration.bind(this));
  }

  trendClass(index: number): string {
    const label = this.trendLabel(index);

    if (label.startsWith('+')) {
      return 'bg-primary-container/30 text-on-primary-container';
    }

    if (label.startsWith('-')) {
      return 'bg-error-container/60 text-on-error-container';
    }

    return 'bg-surface-container-high text-on-surface-variant';
  }

  toggleEntry(entry: ExerciseProgressEntry): void {
    // Alterna el panel expandido de una entrada.
    this.expandedEntryId = this.expandedEntryId === entry.entryId ? null : entry.entryId;
  }

  isExpanded(entry: ExerciseProgressEntry): boolean {
    return this.expandedEntryId === entry.entryId;
  }

  trackByEntry(_: number, entry: ExerciseProgressEntry): number {
    return entry.entryId ?? entry.sessionId ?? 0;
  }

  chartItems(): ExerciseProgressEntry[] {
    // Reduce el historial al subconjunto usado en la grafica.
    return this.exerciseProgressDomainService.chartItems(this.progress?.items ?? []);
  }

  chartPath(): string {
    return this.exerciseProgressDomainService.chartPath(this.chartItems(), this.progress?.item.type);
  }

  chartAreaPath(): string {
    return this.exerciseProgressDomainService.chartAreaPath(this.chartPath());
  }

  chartPointX(index: number, total: number): number {
    return this.exerciseProgressDomainService.chartPointX(index, total);
  }

  chartPointY(entry: ExerciseProgressEntry): number {
    return this.exerciseProgressDomainService.chartPointY(entry, this.chartItems(), this.progress?.item.type);
  }

  chartValueLabel(entry: ExerciseProgressEntry): string {
    // Prioriza peso, luego top set textual y luego duracion.
    if (this.progress?.item.type === 'strength' && entry.topSetWeightKg !== null) {
      return `${this.formatNumber(entry.topSetWeightKg, 1)} kg`;
    }

    if (entry.topSet) {
      return entry.topSet;
    }

    if (entry.durationSeconds > 0) {
      return this.formatDuration(entry.durationSeconds);
    }

    return '-';
  }

  recommendationClass(action: ExerciseRecommendationAction): string {
    if (action === 'increase') {
      return 'bg-primary-container/40 text-on-primary-container';
    }

    if (action === 'decrease') {
      return 'bg-error-container/70 text-on-error-container';
    }

    return 'bg-surface-container-high text-on-surface-variant';
  }

  recommendationLabel(action: ExerciseRecommendationAction): string {
    if (action === 'increase') {
      return 'Subir peso';
    }

    if (action === 'decrease') {
      return 'Bajar peso';
    }

    return 'Mantener peso';
  }
}
