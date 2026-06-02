import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NumberEsPipe } from '../shared/pipes/number-es.pipe';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';
import { WorkoutSession } from '../sessions/session.model';
import { WorkoutSessionsFacade } from '../sessions/state/workout-sessions.facade';
import { CalendarDay, CalendarDomainService } from './calendar-domain.service';

@Component({
  selector: 'app-calendar-page',
  imports: [NgClass, NumberEsPipe, RouterLink, ThemeToggleButtonComponent],
  templateUrl: './calendar-page.html',
})
export class CalendarPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly weekdayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  currentMonth: Date;
  days: CalendarDay[] = [];
  selectedDayIso: string | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private readonly workoutSessionsFacade: WorkoutSessionsFacade,
    private readonly calendarDomainService: CalendarDomainService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {
    this.currentMonth = this.calendarDomainService.startOfMonth(new Date());
  }

  ngOnInit(): void {
    // Carga el mes inicial al montar la vista.
    this.loadMonth();
  }

  get monthLabel(): string {
    // Titulo legible del mes mostrado.
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(this.currentMonth);
  }

  previousMonth(): void {
    // Avanza la vista al mes anterior.
    this.currentMonth = this.calendarDomainService.startOfMonth(new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1));
    this.loadMonth();
  }

  nextMonth(): void {
    // Avanza la vista al mes siguiente.
    this.currentMonth = this.calendarDomainService.startOfMonth(new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1));
    this.loadMonth();
  }

  selectDay(day: CalendarDay): void {
    // Marca el dia elegido para el panel lateral.
    this.selectedDayIso = day.iso;
  }

  isSelected(day: CalendarDay): boolean {
    return this.selectedDayIso === day.iso;
  }

  isTrained(day: CalendarDay): boolean {
    return day.sessions.length > 0;
  }

  selectedDay(): CalendarDay | null {
    // Resuelve el dia actualmente seleccionado.
    return this.days.find((day) => day.iso === this.selectedDayIso) ?? null;
  }

  selectedPrimarySession(): WorkoutSession | null {
    const day = this.selectedDay();
    if (day === null || day.sessions.length === 0) {
      return null;
    }

    return day.sessions[0];
  }

  selectedAdditionalSessionsCount(): number {
    const day = this.selectedDay();

    if (day === null || day.sessions.length <= 1) {
      return 0;
    }

    return day.sessions.length - 1;
  }

  selectedDayLabel(): string {
    const day = this.selectedDay();

    if (day === null) {
      return '';
    }

    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(day.iso));
  }

  sessionDurationLabel(session: WorkoutSession): string {
    if (session.startedAt !== null && session.finishedAt !== null) {
      const start = new Date(session.startedAt).getTime();
      const end = new Date(session.finishedAt).getTime();
      const minutes = Math.max(0, Math.round((end - start) / 60000));

      if (minutes > 0) {
        return `${minutes} min`;
      }
    }

    if (session.cardioDurationSeconds > 0) {
      return `${Math.max(1, Math.round(session.cardioDurationSeconds / 60))} min`;
    }

    return '-';
  }

  private loadMonth(): void {
    // Recarga sesiones y reconstruye la grilla del mes.
    this.isLoading = true;
    this.errorMessage = null;

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth() + 1;

    this.workoutSessionsFacade
      .byMonth(year, month)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          const sessionsByDay = this.calendarDomainService.groupSessionsByDay(items);
          this.days = this.calendarDomainService.buildMonthDays(this.currentMonth, sessionsByDay);
          this.selectedDayIso = this.calendarDomainService.pickSelectedDayIso(this.days, this.selectedDayIso);
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No se han podido cargar las sesiones del calendario.';
          this.days = this.calendarDomainService.buildMonthDays(this.currentMonth, new Map());
          this.selectedDayIso = this.calendarDomainService.pickSelectedDayIso(this.days, this.selectedDayIso);
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }
}
