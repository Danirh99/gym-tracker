import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Exercise } from '../exercises/exercise.model';
import { ExercisesFacade } from '../exercises/state/exercises.facade';
import { AddSessionExercisePayload, WorkoutEntry } from './session.model';
import { StrengthEntryFormStore } from './state/strength-entry-form.store';
import { WorkoutSessionsFacade } from './state/workout-sessions.facade';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';
import { UiToastStore } from '../shared/ui-feedback/ui-toast.store';
import { ExerciseSelectorComponent } from './ui/exercise-selector.component';
import { StrengthSetRow, StrengthSetsTableComponent } from './ui/strength-sets-table.component';

@Component({
  selector: 'app-add-session-exercise-page',
  imports: [ConfirmDialogComponent, ExerciseSelectorComponent, FormsModule, NgClass, RouterLink, StrengthSetsTableComponent, ThemeToggleButtonComponent],
  providers: [StrengthEntryFormStore, UiToastStore],
  templateUrl: './add-session-exercise-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSessionExercisePage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  /** Id de sesion destino de la nueva entrada o la entrada editada. */
  sessionId: number | null = null;
  /** Id de entrada a editar cuando la ruta es de edicion. */
  entryId: number | null = null;
  /** Catalogo de ejercicios filtrado por tipo fuerza. */
  exercises: Exercise[] = [];
  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;
  showDeleteDialog = false;
  setPendingDeletionIndex: number | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly exercisesFacade: ExercisesFacade,
    private readonly workoutSessionsFacade: WorkoutSessionsFacade,
    readonly formStore: StrengthEntryFormStore,
    readonly toastStore: UiToastStore,
  ) {}

  get isEditMode(): boolean {
    return this.entryId !== null;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Editar ejercicio' : 'Añadir ejercicio';
  }

  get saveLabel(): string {
    return this.isEditMode ? 'Guardar cambios' : 'Guardar';
  }

  get searchTerm(): string {
    return this.formStore.searchTerm();
  }

  set searchTerm(value: string) {
    this.formStore.searchTerm.set(value);
  }

  get notes(): string {
    return this.formStore.notes();
  }

  set notes(value: string) {
    this.formStore.notes.set(value);
  }

  get sets(): StrengthSetRow[] {
    return this.formStore.sets();
  }

  get selectedExerciseId(): number | null {
    return this.formStore.selectedExerciseId();
  }

  get exerciseHistory(): string | null {
    return this.formStore.exerciseHistory();
  }

  get toastMessage(): string | null {
    return this.toastStore.message();
  }

  get toastTone(): 'success' | 'error' {
    return this.toastStore.tone();
  }

  ngOnInit(): void {
    // Valida id de ruta y prepara carga inicial.
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const rawEntryId = this.route.snapshot.paramMap.get('entryId');
    const entryId = rawEntryId === null ? null : Number(rawEntryId);

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'La sesión solicitada no es válida.';
      this.isLoading = false;
      this.changeDetectorRef.markForCheck();
      return;
    }

    if (entryId !== null && (!Number.isInteger(entryId) || entryId <= 0)) {
      this.errorMessage = 'El ejercicio solicitado no es válido.';
      this.isLoading = false;
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.sessionId = id;
    this.entryId = entryId;

    if (this.isEditMode) {
      this.loadSessionAndExercises();
      return;
    }

    this.loadExercises();
  }

  visibleExercises(): Exercise[] {
    // Aplica busqueda local sobre los ejercicios cargados.
    return this.formStore.visibleExercises(this.exercises);
  }

  selectExercise(exercise: Exercise): void {
    // Asigna el ejercicio activo del formulario.
    this.formStore.selectExercise(exercise);
  }

  addSet(): void {
    // Agrega una nueva fila de fuerza.
    this.formStore.addSet();
  }

  openRemoveSetDialog(index: number): void {
    // Mantiene una serie minima para evitar payload vacio accidental.
    if (this.sets.length === 1) {
      this.toastStore.show('Debe quedar al menos 1 serie.', 'error');
      return;
    }

    this.setPendingDeletionIndex = index;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    // Limpia la seleccion de borrado.
    this.showDeleteDialog = false;
    this.setPendingDeletionIndex = null;
  }

  removeSet(): void {
    // Elimina la fila marcada y notifica con un toast.
    if (this.setPendingDeletionIndex === null) {
      return;
    }

    const index = this.setPendingDeletionIndex;
    const removedSetNumber = this.sets[index]?.setNumber ?? index + 1;

    this.formStore.removeSet(index);
    this.closeDeleteDialog();
    this.toastStore.show(`Serie ${removedSetNumber} eliminada.`, 'success');
  }

  save(): void {
    // Protege contra estados invalidos o envios duplicados.
    if (!this.canSave() || this.sessionId === null || this.selectedExerciseId === null || this.isSaving) {
      return;
    }

    if (this.isEditMode && this.entryId === null) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;

    const payload: AddSessionExercisePayload = {
      exerciseId: this.selectedExerciseId,
      notes: this.formStore.payloadNotes(),
      sets: this.formStore.buildSetsPayload(),
    };

    const selectedExerciseId = this.selectedExerciseId;
    const request$ = this.isEditMode
      ? this.workoutSessionsFacade.updateEntry(this.sessionId, this.entryId as number, payload)
      : this.workoutSessionsFacade.addEntry(this.sessionId, payload);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const exerciseName = this.exercises.find((exercise) => exercise.id === selectedExerciseId)?.name.trim() ?? '';
          const message = this.isEditMode
            ? (exerciseName === '' ? 'Ejercicio actualizado.' : `Ejercicio actualizado: ${exerciseName}`)
            : (exerciseName === '' ? 'Ejercicio agregado a la sesion.' : `Ejercicio agregado: ${exerciseName}`);
          window.sessionStorage.setItem('sessionToast', message);
          void this.router.navigate(['/sessions', this.sessionId]);
        },
        error: () => {
          this.errorMessage = this.isEditMode
            ? 'No se ha podido actualizar el ejercicio.'
            : 'No se ha podido guardar el ejercicio.';
          this.isSaving = false;
        },
      });
  }

  canSave(): boolean {
    // Reutiliza la validacion encapsulada en el store.
    return this.formStore.canSave();
  }

  private loadExercises(): void {
    // Carga y filtra ejercicios de fuerza para la sesion.
    this.isLoading = true;
    this.errorMessage = null;

    this.exercisesFacade
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const items = Array.isArray(response?.items) ? response.items : [];
          this.exercises = items.filter((exercise) => exercise.type === 'strength');
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No se han podido cargar los ejercicios.';
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private loadSessionAndExercises(): void {
    // Carga sesion, catalogo y entrada objetivo en paralelo para soportar edicion.
    this.isLoading = true;
    this.errorMessage = null;

    this.workoutSessionsFacade
      .detail(this.sessionId as number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ item }) => {
          const entry = item.entries.find((candidate) => candidate.id === this.entryId) ?? null;

          if (entry === null) {
            this.errorMessage = 'El ejercicio solicitado no es válido.';
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
            return;
          }

          this.loadExercisesForEdit(entry);
        },
        error: () => {
          this.errorMessage = 'No se ha podido cargar la sesión.';
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private loadExercisesForEdit(entry: WorkoutEntry): void {
    // Carga catalogo y filtra por fuerza; si la entrada no es de fuerza, error.
    this.exercisesFacade
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const items = Array.isArray(response?.items) ? response.items : [];
          this.exercises = items.filter((exercise) => exercise.type === 'strength');

          if (entry.type !== 'strength') {
            this.errorMessage = 'Este ejercicio no es de fuerza.';
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
            return;
          }

          const linkedExercise: Exercise | undefined = this.exercises.find((exercise) => exercise.id === entry.exerciseId);

          if (linkedExercise === undefined) {
            this.errorMessage = 'El ejercicio ya no está disponible en el catálogo.';
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
            return;
          }

          this.formStore.initFromEntry(entry, linkedExercise);
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No se han podido cargar los ejercicios.';
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

}
