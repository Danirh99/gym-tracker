import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
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
  }

  selectType(type: ExerciseType): void {
    // Cambia el tipo de ejercicio analizado.
    this.selectedType = type;
  }

  dayMetrics(): DayMetric[] {
    // Devuelve las sesiones agregadas por dia para el periodo activo.
    return this.chartsAnalyticsService.dayMetrics(this.sessions, this.selectedPeriod);
  }

  weeklySessionCount(): number {
    // Total de sesiones visibles en la semana.
    return this.dayMetrics().reduce((total, day) => total + day.count, 0);
  }

  maxDayCount(): number {
    // Escala maxima para calcular alturas del grafico.
    return Math.max(...this.dayMetrics().map((item) => item.count), 1);
  }

  barHeight(day: DayMetric): number {
    // Convierte el conteo del dia en porcentaje de altura.
    const percentage = (day.count / this.maxDayCount()) * 100;
    return Math.max(percentage, day.count > 0 ? 12 : 0);
  }

  periodSessionsCount(): number {
    // Sesiones que entran en el rango temporal seleccionado.
    return this.chartsAnalyticsService.sessionsInRange(this.sessions, this.selectedPeriod).length;
  }

  typeTrendPercent(): number {
    // Compara la mitad inicial frente a la mitad final de la serie.
    const points = this.typePoints();
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

  typePath(): string {
    // Genera la ruta SVG de la linea principal.
    const points = this.typePoints();
    if (points.length === 0) {
      return 'M0,130 L400,130';
    }

    return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  }

  typeAreaPath(): string {
    // Cierra la zona rellena bajo la linea.
    const points = this.typePoints();
    if (points.length === 0) {
      return 'M0,130 L400,130 L400,150 L0,150 Z';
    }

    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
    return `${line} L400,150 L0,150 Z`;
  }

  recordMessage(): string {
    // Resume si el mejor pico es historico o del periodo actual.
    const allSessions = this.sessions;
    if (allSessions.length === 0) {
      return 'Registra tu primer entrenamiento para desbloquear récords.';
    }

    const bestSession = allSessions.reduce((best, current) => (current.totalVolumeKg > best.totalVolumeKg ? current : best));
    const periodSessions = this.chartsAnalyticsService.sessionsInRange(this.sessions, this.selectedPeriod);
    const periodBest =
      periodSessions.length > 0
        ? periodSessions.reduce((best, current) => (current.totalVolumeKg > best.totalVolumeKg ? current : best))
        : null;

    if (periodBest !== null && periodBest.id === bestSession.id) {
      return `Nuevo pico: ${this.formatNumber(bestSession.totalVolumeKg)} kg en ${bestSession.displayName}.`;
    }

    return `Mejor marca histórica: ${this.formatNumber(bestSession.totalVolumeKg)} kg en ${bestSession.displayName}.`;
  }

  selectedTypeTitle(): string {
    // Traduce el tipo actual a un titulo de panel.
    if (this.selectedType === 'strength') {
      return 'Volumen de fuerza';
    }

    if (this.selectedType === 'cardio') {
      return 'Duracion de cardio';
    }

    if (this.selectedType === 'core') {
      return 'Trabajo de core';
    }

    return 'Actividad de ejercicios varios';
  }

  selectedTypeYAxisLabel(): string {
    // Ajusta la unidad mostrada en el eje Y.
    if (this.selectedType === 'strength') {
      return 'kg';
    }

    if (this.selectedType === 'cardio') {
      return 'min';
    }

    if (this.selectedType === 'core') {
      return 'reps';
    }

    return 'series';
  }

  selectedTypeTotalLabel(): string {
    // Formatea el total acumulado segun la unidad activa.
    const total = this.typePoints().reduce((acc, point) => acc + point.y, 0);

    if (this.selectedType === 'strength') {
      return `${this.formatNumber(total)} kg`;
    }

    if (this.selectedType === 'cardio') {
      return `${this.formatNumber(total)} min`;
    }

    if (this.selectedType === 'core') {
      return `${this.formatNumber(total)} reps`;
    }

    return `${this.formatNumber(total)} series`;
  }

  selectedTypeDescription(): string {
    // Explica la serie que se esta mostrando.
    if (this.selectedType === 'strength') {
      return 'Tendencia de volumen en kg para el periodo seleccionado';
    }

    if (this.selectedType === 'cardio') {
      return 'Tendencia de minutos de cardio por dia';
    }

    if (this.selectedType === 'core') {
      return 'Tendencia de repeticiones de ejercicios de core';
    }

    return 'Tendencia de series registradas en ejercicios de tipo otro';
  }

  selectedTypeStatCards(): TypeStatCard[] {
    // Construye las tarjetas resumen del panel activo.
    if (this.selectedType === 'strength') {
      return [
        { icon: 'fitness_center', value: `${this.formatNumber(this.periodStrengthVolumeKg())} kg`, label: 'volumen', tone: 'secondary' },
        { icon: 'repeat', value: `${this.formatNumber(this.periodTypeSetCount())}`, label: 'series', tone: 'tertiary' },
      ];
    }

    if (this.selectedType === 'cardio') {
      return [
        { icon: 'timer', value: `${this.formatNumber(this.periodTypeDurationMinutes())} min`, label: 'de cardio', tone: 'secondary' },
        { icon: 'directions_run', value: `${this.formatDistance(this.periodTypeDistanceKm())} km`, label: 'acumulados', tone: 'tertiary' },
      ];
    }

    if (this.selectedType === 'core') {
      return [
        { icon: 'self_improvement', value: `${this.formatNumber(this.periodTypeReps())} reps`, label: 'totales', tone: 'secondary' },
        { icon: 'hourglass_bottom', value: `${this.formatNumber(this.periodTypeDurationMinutes())} min`, label: 'acumulados', tone: 'tertiary' },
      ];
    }

    return [
      { icon: 'category', value: `${this.formatNumber(this.periodTypeSetCount())}`, label: 'series', tone: 'secondary' },
      { icon: 'event_available', value: `${this.formatNumber(this.periodTypeSessionsCount())}`, label: 'sesiones', tone: 'tertiary' },
    ];
  }

  formatNumber(value: number): string {
    // Reutiliza el formateo numerico local.
    return formatNumberEs(value);
  }

  formatDistance(distanceKm: number): string {
    // Formatea distancia con un decimal fijo.
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(distanceKm);
  }

  volumeTrendPercent(): number {
    return this.typeTrendPercent();
  }

  volumePath(): string {
    return this.typePath();
  }

  volumeAreaPath(): string {
    return this.typeAreaPath();
  }

  periodVolumeKg(): number {
    return this.periodStrengthVolumeKg();
  }

  periodCardioMinutes(): number {
    return this.periodTypeDurationMinutes();
  }

  periodDistanceKm(): number {
    return this.periodTypeDistanceKm();
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
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No se han podido cargar los datos de las gráficas.';
          this.sessions = [];
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private sessionsInRange(period: ChartPeriod): WorkoutSession[] {
    // Centraliza el filtrado por periodo.
    return this.chartsAnalyticsService.sessionsInRange(this.sessions, period);
  }

  private typePoints(): VolumePoint[] {
    // Recalcula los puntos de la serie grafica.
    return this.chartsAnalyticsService.typePoints(this.sessions, this.selectedPeriod, this.selectedType);
  }

  private periodTypeSessionsCount(): number {
    // Calcula cuantas sesiones incluyen el tipo actual.
    return this.chartsAnalyticsService.periodTypeSessionsCount(this.sessions, this.selectedPeriod, this.selectedType);
  }

  private periodTypeSetCount(): number {
    // Calcula el total de series del tipo activo.
    return this.chartsAnalyticsService.periodTypeSetCount(this.sessions, this.selectedPeriod, this.selectedType);
  }

  private periodTypeReps(): number {
    // Calcula repeticiones totales del tipo activo.
    return this.chartsAnalyticsService.periodTypeReps(this.sessions, this.selectedPeriod, this.selectedType);
  }

  private periodTypeDurationMinutes(): number {
    // Calcula minutos totales del tipo activo.
    return this.chartsAnalyticsService.periodTypeDurationMinutes(this.sessions, this.selectedPeriod, this.selectedType);
  }

  private periodTypeDistanceKm(): number {
    // Calcula distancia total del tipo activo.
    return this.chartsAnalyticsService.periodTypeDistanceKm(this.sessions, this.selectedPeriod, this.selectedType);
  }

  private periodStrengthVolumeKg(): number {
    // Calcula volumen total de fuerza para la vista.
    return this.chartsAnalyticsService.periodStrengthVolumeKg(this.sessions, this.selectedPeriod);
  }
}
