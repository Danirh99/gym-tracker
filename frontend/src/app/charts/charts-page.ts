import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { formatNumberEs } from '../core/utils/format.utils';
import { ChartPeriod, ChartsAnalyticsService, VolumePoint } from './charts-analytics.service';
import { WorkoutSession } from '../sessions/session.model';
import { WorkoutSessionsFacade } from '../sessions/state/workout-sessions.facade';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';

interface DayMetric {
  label: string;
  count: number;
}

interface TypeStatCard {
  icon: string;
  value: string;
  label: string;
  tone: 'secondary' | 'tertiary';
}

@Component({
  selector: 'app-charts-page',
  imports: [NgClass, ThemeToggleButtonComponent],
  templateUrl: './charts-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartsPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly periodButtons: Array<{ value: ChartPeriod; label: string }> = [
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' },
  ];

  selectedPeriod: ChartPeriod = 'week';
  selectedMuscleGroup = '';
  muscleButtons: Array<{ value: string; label: string }> = [];
  sessions: WorkoutSession[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  dayMetricsValue: DayMetric[] = [];
  weeklySessionCountValue = 0;
  periodSessionChartTitleValue = 'Sesiones por semana';
  periodSessionCountLabelValue = '0 sesiones esta semana';
  maxDayCountValue = 1;
  periodSessionsCountValue = 0;
  typeTrendPercentValue = 0;
  typePathValue = 'M0,130 L400,130';
  typeAreaPathValue = 'M0,130 L400,130 L400,150 L0,150 Z';
  selectedTypeTitleValue = 'Trabajo por músculo';
  selectedTypeYAxisLabelValue = 'series';
  selectedTypeTotalLabelValue = '0 series';
  selectedTypeDescriptionValue = 'Tendencia de series para el grupo muscular seleccionado';
  selectedTypeStatCardsValue: TypeStatCard[] = [];
  recordMessageValue = 'Registra tu primer entrenamiento para desbloquear récords.';

  constructor(
    private readonly workoutSessionsFacade: WorkoutSessionsFacade,
    private readonly chartsAnalyticsService: ChartsAnalyticsService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Carga las sesiones al montar la vista de analitica.
    this.loadSessions();
  }

  selectPeriod(period: ChartPeriod): void {
    // Cambia el periodo activo del dashboard.
    this.selectedPeriod = period;
    this.recomputeChartState();
    this.changeDetectorRef.markForCheck();
  }

  selectMuscleGroup(muscleGroup: string): void {
    // Cambia el grupo muscular analizado.
    this.selectedMuscleGroup = muscleGroup;
    this.recomputeChartState();
    this.changeDetectorRef.markForCheck();
  }

  barHeight(day: DayMetric): number {
    // Convierte el conteo del dia en porcentaje de altura.
    const percentage = (day.count / this.maxDayCountValue) * 100;
    return Math.max(percentage, day.count > 0 ? 12 : 0);
  }

  formatNumber(value: number): string {
    // Reutiliza el formateo numerico local.
    return formatNumberEs(value);
  }

  formatDistance(distanceKm: number): string {
    // Formatea distancia con un decimal fijo.
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(distanceKm);
  }

  private loadSessions(): void {
    // Carga el historial completo para calcular los graficos.
    this.isLoading = true;
    this.errorMessage = null;

    this.workoutSessionsFacade
      .all()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          this.sessions = [...items].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
          this.syncMuscleButtons();
          this.recomputeChartState();
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No se han podido cargar los datos de las gráficas.';
          this.sessions = [];
          this.syncMuscleButtons();
          this.recomputeChartState();
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private recomputeChartState(): void {
    // Agrupa todos los calculos derivados para no repetirlos durante el render.
    const dayMetrics = this.chartsAnalyticsService.dayMetrics(this.sessions, this.selectedPeriod);
    const typePoints = this.chartsAnalyticsService.musclePoints(this.sessions, this.selectedPeriod, this.selectedMuscleGroup);
    const periodSessions = this.chartsAnalyticsService.sessionsInRange(this.sessions, this.selectedPeriod);
    const periodStrengthVolumeKg = this.chartsAnalyticsService.periodMuscleStrengthVolumeKg(this.sessions, this.selectedPeriod, this.selectedMuscleGroup);
    const periodTypeSetCount = this.chartsAnalyticsService.periodMuscleSetCount(this.sessions, this.selectedPeriod, this.selectedMuscleGroup);
    const periodTypeDurationMinutes = this.chartsAnalyticsService.periodMuscleDurationMinutes(this.sessions, this.selectedPeriod, this.selectedMuscleGroup);
    const periodTypeSessionsCount = this.chartsAnalyticsService.periodMuscleSessionsCount(this.sessions, this.selectedPeriod, this.selectedMuscleGroup);

    this.dayMetricsValue = dayMetrics;
    this.weeklySessionCountValue = periodSessions.length;
    this.periodSessionChartTitleValue = this.periodSessionChartTitle();
    this.periodSessionCountLabelValue = this.periodSessionCountLabel(periodSessions.length);
    this.maxDayCountValue = Math.max(...dayMetrics.map((item) => item.count), 1);
    this.periodSessionsCountValue = periodSessions.length;
    this.typeTrendPercentValue = this.computeTrendPercent(typePoints);
    this.typePathValue = this.pointsToPath(typePoints);
    this.typeAreaPathValue = this.pointsToAreaPath(typePoints);
    this.selectedTypeTitleValue = this.muscleTitle();
    this.selectedTypeYAxisLabelValue = 'series';
    this.selectedTypeDescriptionValue = this.muscleDescription();
    this.selectedTypeTotalLabelValue = this.typeTotalLabel({
      periodTypeSetCount,
    });
    this.selectedTypeStatCardsValue = this.typeStatCards({
      periodStrengthVolumeKg,
      periodTypeSetCount,
      periodTypeDurationMinutes,
      periodTypeSessionsCount,
    });
    this.recordMessageValue = this.buildRecordMessage(periodSessions);
  }

  private computeTrendPercent(points: VolumePoint[]): number {
    if (points.length < 2) {
      return 0;
    }

    const half = Math.floor(points.length / 2);
    const firstValue = points.slice(0, half).reduce((total, point) => total + point.y, 0);
    const secondValue = points.slice(half).reduce((total, point) => total + point.y, 0);

    if (firstValue === 0) {
      return secondValue > 0 ? 100 : 0;
    }

    return Math.round(((secondValue - firstValue) / firstValue) * 100);
  }

  private pointsToPath(points: VolumePoint[]): string {
    if (points.length === 0) {
      return 'M0,130 L400,130';
    }

    return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  }

  private pointsToAreaPath(points: VolumePoint[]): string {
    if (points.length === 0) {
      return 'M0,130 L400,130 L400,150 L0,150 Z';
    }

    return `${this.pointsToPath(points)} L400,150 L0,150 Z`;
  }

  private muscleTitle(): string {
    if (this.selectedMuscleGroup === '') {
      return 'Trabajo por músculo';
    }

    return `Trabajo de ${this.selectedMuscleGroup}`;
  }

  private muscleDescription(): string {
    if (this.selectedMuscleGroup === '') {
      return 'Crea ejercicios con grupos musculares para ver esta tendencia';
    }

    return `Tendencia de series registradas para ${this.selectedMuscleGroup}`;
  }

  private periodSessionChartTitle(): string {
    if (this.selectedPeriod === 'month') {
      return 'Sesiones este mes';
    }

    if (this.selectedPeriod === 'year') {
      return 'Sesiones este año';
    }

    return 'Sesiones por semana';
  }

  private periodSessionCountLabel(count: number): string {
    const suffix = count === 1 ? 'sesión' : 'sesiones';

    if (this.selectedPeriod === 'month') {
      return `${count} ${suffix} este mes`;
    }

    if (this.selectedPeriod === 'year') {
      return `${count} ${suffix} este año`;
    }

    return `${count} ${suffix} esta semana`;
  }

  private typeTotalLabel(metrics: {
    periodTypeSetCount: number;
  }): string {
    return `${this.formatNumber(metrics.periodTypeSetCount)} series`;
  }

  private typeStatCards(metrics: {
    periodStrengthVolumeKg: number;
    periodTypeSetCount: number;
    periodTypeDurationMinutes: number;
    periodTypeSessionsCount: number;
  }): TypeStatCard[] {
    return [
      { icon: 'fitness_center', value: `${this.formatNumber(metrics.periodStrengthVolumeKg)} kg`, label: 'volumen fuerza', tone: 'secondary' },
      { icon: 'repeat', value: `${this.formatNumber(metrics.periodTypeSetCount)}`, label: 'series', tone: 'tertiary' },
      { icon: 'timer', value: `${this.formatNumber(metrics.periodTypeDurationMinutes)} min`, label: 'duración', tone: 'secondary' },
      { icon: 'event_available', value: `${this.formatNumber(metrics.periodTypeSessionsCount)}`, label: 'sesiones', tone: 'tertiary' },
    ];
  }

  private syncMuscleButtons(): void {
    const muscleGroups = this.chartsAnalyticsService.muscleGroups(this.sessions);
    this.muscleButtons = muscleGroups.map((muscleGroup) => ({ value: muscleGroup, label: muscleGroup }));

    if (!muscleGroups.includes(this.selectedMuscleGroup)) {
      this.selectedMuscleGroup = muscleGroups[0] ?? '';
    }
  }

  private buildRecordMessage(periodSessions: WorkoutSession[]): string {
    const allSessions = this.sessions;
    if (allSessions.length === 0) {
      return 'Registra tu primer entrenamiento para desbloquear récords.';
    }

    const bestSession = allSessions.reduce((best, current) => (current.totalVolumeKg > best.totalVolumeKg ? current : best));
    const periodBest =
      periodSessions.length > 0
        ? periodSessions.reduce((best, current) => (current.totalVolumeKg > best.totalVolumeKg ? current : best))
        : null;

    if (periodBest !== null && periodBest.id === bestSession.id) {
      return `Nuevo pico: ${this.formatNumber(bestSession.totalVolumeKg)} kg en ${bestSession.displayName}.`;
    }

    return `Mejor marca histórica: ${this.formatNumber(bestSession.totalVolumeKg)} kg en ${bestSession.displayName}.`;
  }

}
