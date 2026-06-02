import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { formatNumberEs } from '../core/utils/format.utils';
import { ChartPeriod, ChartsAnalyticsService, VolumePoint } from './charts-analytics.service';
import { ExerciseType, WorkoutSession } from '../sessions/session.model';
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
    { value: 'all', label: 'Todo' },
  ];

  readonly typeButtons: Array<{ value: ExerciseType; label: string }> = [
    { value: 'strength', label: 'Fuerza' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'core', label: 'Core' },
    { value: 'other', label: 'Otro' },
  ];

  selectedPeriod: ChartPeriod = 'week';
  selectedType: ExerciseType = 'strength';
  sessions: WorkoutSession[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  dayMetricsValue: DayMetric[] = [];
  weeklySessionCountValue = 0;
  maxDayCountValue = 1;
  periodSessionsCountValue = 0;
  typeTrendPercentValue = 0;
  typePathValue = 'M0,130 L400,130';
  typeAreaPathValue = 'M0,130 L400,130 L400,150 L0,150 Z';
  selectedTypeTitleValue = 'Volumen de fuerza';
  selectedTypeYAxisLabelValue = 'kg';
  selectedTypeTotalLabelValue = '0 kg';
  selectedTypeDescriptionValue = 'Tendencia de volumen en kg para el periodo seleccionado';
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

  selectType(type: ExerciseType): void {
    // Cambia el tipo de ejercicio analizado.
    this.selectedType = type;
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
          this.recomputeChartState();
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No se han podido cargar los datos de las gráficas.';
          this.sessions = [];
          this.recomputeChartState();
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private recomputeChartState(): void {
    // Agrupa todos los calculos derivados para no repetirlos durante el render.
    const dayMetrics = this.chartsAnalyticsService.dayMetrics(this.sessions, this.selectedPeriod);
    const typePoints = this.chartsAnalyticsService.typePoints(this.sessions, this.selectedPeriod, this.selectedType);
    const periodSessions = this.chartsAnalyticsService.sessionsInRange(this.sessions, this.selectedPeriod);
    const periodStrengthVolumeKg = this.chartsAnalyticsService.periodStrengthVolumeKg(this.sessions, this.selectedPeriod);
    const periodTypeSetCount = this.chartsAnalyticsService.periodTypeSetCount(this.sessions, this.selectedPeriod, this.selectedType);
    const periodTypeDurationMinutes = this.chartsAnalyticsService.periodTypeDurationMinutes(this.sessions, this.selectedPeriod, this.selectedType);
    const periodTypeDistanceKm = this.chartsAnalyticsService.periodTypeDistanceKm(this.sessions, this.selectedPeriod, this.selectedType);
    const periodTypeReps = this.chartsAnalyticsService.periodTypeReps(this.sessions, this.selectedPeriod, this.selectedType);
    const periodTypeSessionsCount = this.chartsAnalyticsService.periodTypeSessionsCount(this.sessions, this.selectedPeriod, this.selectedType);

    this.dayMetricsValue = dayMetrics;
    this.weeklySessionCountValue = dayMetrics.reduce((total, day) => total + day.count, 0);
    this.maxDayCountValue = Math.max(...dayMetrics.map((item) => item.count), 1);
    this.periodSessionsCountValue = periodSessions.length;
    this.typeTrendPercentValue = this.computeTrendPercent(typePoints);
    this.typePathValue = this.pointsToPath(typePoints);
    this.typeAreaPathValue = this.pointsToAreaPath(typePoints);
    this.selectedTypeTitleValue = this.typeTitle(this.selectedType);
    this.selectedTypeYAxisLabelValue = this.typeYAxisLabel(this.selectedType);
    this.selectedTypeDescriptionValue = this.typeDescription(this.selectedType);
    this.selectedTypeTotalLabelValue = this.typeTotalLabel({
      periodStrengthVolumeKg,
      periodTypeSetCount,
      periodTypeDurationMinutes,
      periodTypeReps,
    });
    this.selectedTypeStatCardsValue = this.typeStatCards({
      periodStrengthVolumeKg,
      periodTypeSetCount,
      periodTypeDurationMinutes,
      periodTypeDistanceKm,
      periodTypeReps,
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

  private typeTitle(type: ExerciseType): string {
    if (type === 'strength') {
      return 'Volumen de fuerza';
    }

    if (type === 'cardio') {
      return 'Duracion de cardio';
    }

    if (type === 'core') {
      return 'Trabajo de core';
    }

    return 'Actividad de ejercicios varios';
  }

  private typeYAxisLabel(type: ExerciseType): string {
    if (type === 'strength') {
      return 'kg';
    }

    if (type === 'cardio') {
      return 'min';
    }

    if (type === 'core') {
      return 'reps';
    }

    return 'series';
  }

  private typeDescription(type: ExerciseType): string {
    if (type === 'strength') {
      return 'Tendencia de volumen en kg para el periodo seleccionado';
    }

    if (type === 'cardio') {
      return 'Tendencia de minutos de cardio por dia';
    }

    if (type === 'core') {
      return 'Tendencia de repeticiones de ejercicios de core';
    }

    return 'Tendencia de series registradas en ejercicios de tipo otro';
  }

  private typeTotalLabel(metrics: {
    periodStrengthVolumeKg: number;
    periodTypeSetCount: number;
    periodTypeDurationMinutes: number;
    periodTypeReps: number;
  }): string {
    if (this.selectedType === 'strength') {
      return `${this.formatNumber(metrics.periodStrengthVolumeKg)} kg`;
    }

    if (this.selectedType === 'cardio') {
      return `${this.formatNumber(metrics.periodTypeDurationMinutes)} min`;
    }

    if (this.selectedType === 'core') {
      return `${this.formatNumber(metrics.periodTypeReps)} reps`;
    }

    return `${this.formatNumber(metrics.periodTypeSetCount)} series`;
  }

  private typeStatCards(metrics: {
    periodStrengthVolumeKg: number;
    periodTypeSetCount: number;
    periodTypeDurationMinutes: number;
    periodTypeDistanceKm: number;
    periodTypeReps: number;
    periodTypeSessionsCount: number;
  }): TypeStatCard[] {
    if (this.selectedType === 'strength') {
      return [
        { icon: 'fitness_center', value: `${this.formatNumber(metrics.periodStrengthVolumeKg)} kg`, label: 'volumen', tone: 'secondary' },
        { icon: 'repeat', value: `${this.formatNumber(metrics.periodTypeSetCount)}`, label: 'series', tone: 'tertiary' },
      ];
    }

    if (this.selectedType === 'cardio') {
      return [
        { icon: 'timer', value: `${this.formatNumber(metrics.periodTypeDurationMinutes)} min`, label: 'de cardio', tone: 'secondary' },
        { icon: 'directions_run', value: `${this.formatDistance(metrics.periodTypeDistanceKm)} km`, label: 'acumulados', tone: 'tertiary' },
      ];
    }

    if (this.selectedType === 'core') {
      return [
        { icon: 'self_improvement', value: `${this.formatNumber(metrics.periodTypeReps)} reps`, label: 'totales', tone: 'secondary' },
        { icon: 'hourglass_bottom', value: `${this.formatNumber(metrics.periodTypeDurationMinutes)} min`, label: 'acumulados', tone: 'tertiary' },
      ];
    }

    return [
      { icon: 'category', value: `${this.formatNumber(metrics.periodTypeSetCount)}`, label: 'series', tone: 'secondary' },
      { icon: 'event_available', value: `${this.formatNumber(metrics.periodTypeSessionsCount)}`, label: 'sesiones', tone: 'tertiary' },
    ];
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
