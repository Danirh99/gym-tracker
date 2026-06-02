import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DurationPipe } from '../shared/pipes/duration.pipe';
import { NumberEsPipe } from '../shared/pipes/number-es.pipe';
import { formatDistanceKmEsFromMeters, formatOptionalNumberEs, formatSessionDateShortWithToday } from '../core/utils/format.utils';
import { ExerciseType, WorkoutEntry, WorkoutSession, WorkoutSet } from './session.model';
import { ExerciseTypeModalComponent } from './exercise-type-modal.component';
import { SessionDetailStore } from './state/session-detail.store';
import { WorkoutSessionsFacade } from './state/workout-sessions.facade';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';
import { UiToastStore } from '../shared/ui-feedback/ui-toast.store';

@Component({
  selector: 'app-session-detail-page',
  imports: [ConfirmDialogComponent, DurationPipe, ExerciseTypeModalComponent, NgClass, NumberEsPipe, RouterLink, ThemeToggleButtonComponent],
  providers: [SessionDetailStore, UiToastStore],
  templateUrl: './session-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionDetailPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly workoutSessionsFacade: WorkoutSessionsFacade,
    readonly store: SessionDetailStore,
    readonly toastStore: UiToastStore,
  ) {}

  get session(): WorkoutSession | null {
    return this.store.session();
  }

  get isLoading(): boolean {
    return this.store.isLoading();
  }

  get errorMessage(): string | null {
    return this.store.errorMessage();
  }

  get showExerciseTypeModal(): boolean {
    return this.store.showExerciseTypeModal();
  }

  get showDeleteDialog(): boolean {
    return this.store.showDeleteDialog();
  }

  get isDeletingEntry(): boolean {
    return this.store.isDeletingEntry();
  }

  get entryPendingDeletion(): WorkoutEntry | null {
    return this.store.entryPendingDeletion();
  }

  get toastMessage(): string | null {
    return this.toastStore.message();
  }

  get toastTone(): 'success' | 'error' {
    return this.toastStore.tone();
  }

  ngOnInit(): void {
    // Obtiene id de ruta y carga detalle inicial de sesion.
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.store.setLoading(false);
      this.store.setError('La sesión solicitada no es válida.');
      return;
    }

    this.showSessionToastFromNavigation();

    this.workoutSessionsFacade
      .detail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ item }) => {
          this.store.setSession(item);
          this.store.setLoading(false);
        },
        error: () => {
          this.store.setError('No se ha podido cargar la sesión.');
          this.store.setLoading(false);
        },
      });
  }

  subtitle(session: WorkoutSession): string {
    // Construye un subtitulo corto con fecha y sensacion.
    const parts = [this.formatDate(session.sessionDate)];

    if (session.moodLabel !== null) {
      parts.push(`Sensación ${session.moodLabel.toLowerCase()}`);
    }

    return parts.join(' · ');
  }

  formatDate(value: string): string {
    // Formatea la fecha de la sesion para cabeceras.
    return formatSessionDateShortWithToday(value);
  }

  isCardio(entry: WorkoutEntry): boolean {
    // Detecta si la entrada pertenece a cardio.
    return entry.type === 'cardio';
  }

  completedSets(entry: WorkoutEntry): number {
    // Cuenta solo las series que tienen datos reales.
    return entry.sets.filter((set) => this.hasSetData(set)).length;
  }

  hasSetData(set: WorkoutSet): boolean {
    // Considera valida cualquier serie con al menos un campo util.
    return set.weightKg !== null || set.reps !== null || set.durationSeconds !== null || set.distanceMeters !== null || set.speedKmh !== null;
  }

  formatDistance(meters: number | null): string {
    // Reutiliza el formateo comun de distancia.
    return formatDistanceKmEsFromMeters(meters);
  }

  formatOptionalNumber(value: number | null): string {
    // Reutiliza el formateo comun de numericos opcionales.
    return formatOptionalNumberEs(value);
  }

  openExerciseTypeModal(): void {
    // Abre el modal para anadir una nueva entrada.
    this.store.openExerciseTypeModal();
  }

  closeExerciseTypeModal(): void {
    // Cierra el modal de tipos.
    this.store.closeExerciseTypeModal();
  }

  routeForExerciseType(type: ExerciseType): (string | number)[] {
    // Construye la ruta de alta segun el tipo elegido.
    const sessionId = this.session?.id ?? Number(this.route.snapshot.paramMap.get('id'));
    return ['/sessions', sessionId, 'exercises', 'new', type];
  }

  goToExerciseType(type: ExerciseType): void {
    // Cierra el modal y navega al formulario de alta.
    this.store.closeExerciseTypeModal();
    void this.router.navigate(this.routeForExerciseType(type));
  }

  routeForEditEntry(entry: WorkoutEntry): (string | number)[] {
    // Construye la ruta de edicion para una entrada concreta segun su tipo.
    const sessionId = this.session?.id ?? Number(this.route.snapshot.paramMap.get('id'));
    return ['/sessions', sessionId, 'exercises', entry.id, 'edit', entry.type];
  }

  openEditEntry(entry: WorkoutEntry): void {
    // Bloquea el acceso a la edicion mientras hay un borrado en curso.
    if (this.isDeletingEntry) {
      return;
    }

    void this.router.navigate(this.routeForEditEntry(entry));
  }

  openDeleteDialog(entry: WorkoutEntry): void {
    // Prepara la entrada para borrado.
    if (this.isDeletingEntry) {
      return;
    }

    this.store.openDeleteDialog(entry);
  }

  closeDeleteDialog(): void {
    // Cancela el borrado si no hay operacion en curso.
    if (this.isDeletingEntry) {
      return;
    }

    this.store.closeDeleteDialog();
  }

  deleteEntry(): void {
    // Protege el flujo frente a ids invalidos y doble click de borrado.
    const rawSessionId = this.session?.id ?? Number(this.route.snapshot.paramMap.get('id'));
    const rawEntryId = this.entryPendingDeletion?.id ?? null;

    if (rawEntryId === null || this.isDeletingEntry) {
      return;
    }

    if (!Number.isInteger(rawSessionId) || rawSessionId <= 0 || !Number.isInteger(rawEntryId) || rawEntryId <= 0) {
      return;
    }

    const sessionId = rawSessionId;
    const entryId = rawEntryId;

    this.store.startDeleting();

    this.workoutSessionsFacade.removeEntry(sessionId, entryId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ item }) => {
        // Captura nombre antes de limpiar estado para mensaje de confirmacion.
        const removedExerciseName = this.entryPendingDeletion?.exerciseName?.trim() ?? '';
        this.store.finishDeleting(item);
        this.toastStore.show(removedExerciseName === '' ? 'Ejercicio eliminado de la sesión.' : `Ejercicio eliminado: ${removedExerciseName}`, 'success');
      },
      error: () => {
        this.store.finishDeleting(null);
        this.toastStore.show('No se ha podido borrar el ejercicio.', 'error');
      },
    });
  }

  private showSessionToastFromNavigation(): void {
    // Recupera un mensaje temporal desde navegacion anterior.
    const message = window.sessionStorage.getItem('sessionToast');

    if (message === null || message.trim() === '') {
      return;
    }

    this.toastStore.show(message.trim(), 'success');
    window.sessionStorage.removeItem('sessionToast');
  }
}
