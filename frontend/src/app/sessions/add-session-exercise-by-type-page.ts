import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Exercise, ExerciseType } from '../exercises/exercise.model';
import { AddSessionExercisePayload } from './session.model';
import { ExercisesFacade } from '../exercises/state/exercises.facade';
import { TypedEntryFormStore, SupportedType } from './state/typed-entry-form.store';
import { WorkoutSessionsFacade } from './state/workout-sessions.facade';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { CardioSetRow, CardioSetsTableComponent } from './ui/cardio-sets-table.component';
import { CoreOtherSetRow, CoreOtherSetsTableComponent } from './ui/core-other-sets-table.component';
import { ExerciseSelectorComponent } from './ui/exercise-selector.component';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';
import { UiToastStore } from '../shared/ui-feedback/ui-toast.store';

interface TypePresentation {
  title: string;
  subtitle: string;
  saveLabel: string;
}

@Component({
  selector: 'app-add-session-exercise-by-type-page',
  imports: [CardioSetsTableComponent, ConfirmDialogComponent, CoreOtherSetsTableComponent, ExerciseSelectorComponent, FormsModule, NgClass, RouterLink, ThemeToggleButtonComponent],
  providers: [TypedEntryFormStore, UiToastStore],
  templateUrl: './add-session-exercise-by-type-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSessionExerciseByTypePage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  /** Id de sesion al que se agrega la entrada. */
  sessionId: number | null = null;
  /** Catalogo de ejercicios filtrado por tipo dinamico de ruta. */
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
    readonly formStore: TypedEntryFormStore,
    readonly toastStore: UiToastStore,
  ) {}

  get type(): SupportedType {
    return this.formStore.type();
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

  get selectedExerciseId(): number | null {
    return this.formStore.selectedExerciseId();
  }

  get selectedExerciseHistory(): string | null {
    return this.formStore.selectedExerciseHistory();
  }

  get cardioSets(): CardioSetRow[] {
    return this.formStore.cardioSets();
  }

  get coreOtherSets(): CoreOtherSetRow[] {
    return this.formStore.coreOtherSets();
  }

  get toastMessage(): string | null {
    return this.toastStore.message();
  }

  get toastTone(): 'success' | 'error' {
    return this.toastStore.tone();
  }

  ngOnInit(): void {
    // Resuelve y valida parametros de ruta necesarios para la pantalla.
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const type = this.route.snapshot.paramMap.get('type');

    if (!Number.isInteger(id) || id <= 0 || !this.isSupportedType(type)) {
      this.errorMessage = 'La ruta solicitada no es válida.';
      this.isLoading = false;
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.sessionId = id;
    this.formStore.initType(type);
    this.loadExercises();
  }

  visibleExercises(): Exercise[] {
    // Filtra catalogo segun el tipo ya resuelto.
    return this.formStore.visibleExercises(this.exercises);
  }

  selectExercise(exercise: Exercise): void {
    // Actualiza el ejercicio seleccionado en el store.
    this.formStore.selectExercise(exercise);
  }

  addSet(): void {
    // Anade una fila nueva al formulario tipado.
    this.formStore.addSet();
  }

  openRemoveSetDialog(index: number): void {
    // Mantiene al menos una fila editable para no romper UX del formulario.
    if (this.type === 'cardio') {
      if (this.cardioSets.length === 1) {
        this.toastStore.show('Debe quedar al menos 1 serie.', 'error');
        return;
      }
    } else if (this.coreOtherSets.length === 1) {
      this.toastStore.show('Debe quedar al menos 1 serie.', 'error');
      return;
    }

    this.setPendingDeletionIndex = index;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    // Cierra el dialogo y limpia el indice temporal.
    this.showDeleteDialog = false;
    this.setPendingDeletionIndex = null;
  }

  removeSet(): void {
    // Elimina la fila elegida y muestra feedback.
    if (this.setPendingDeletionIndex === null) {
      return;
    }

    const index = this.setPendingDeletionIndex;

    const removedSetNumber = (this.type === 'cardio' ? this.cardioSets[index] : this.coreOtherSets[index])?.setNumber ?? index + 1;
    this.formStore.removeSet(index);
    this.closeDeleteDialog();
    this.toastStore.show(`Serie ${removedSetNumber} eliminada.`, 'success');
  }

  canSave(): boolean {
    // Encapsula la validacion de persistencia.
    return this.formStore.canSave();
  }

  save(): void {
    // Evita guardado cuando el estado local aun no es consistente.
    if (!this.canSave() || this.isSaving || this.selectedExerciseId === null || this.sessionId === null) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;

    const payload: AddSessionExercisePayload = {
      exerciseId: this.selectedExerciseId,
      notes: this.formStore.payloadNotes(),
      sets: this.formStore.buildSetsPayload(),
    };

    this.workoutSessionsFacade
      .addEntry(this.sessionId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const exerciseName = this.exercises.find((exercise) => exercise.id === this.selectedExerciseId)?.name.trim() ?? '';
          const message = exerciseName === '' ? 'Ejercicio agregado a la sesion.' : `Ejercicio agregado: ${exerciseName}`;
          window.sessionStorage.setItem('sessionToast', message);
          void this.router.navigate(['/sessions', this.sessionId]);
        },
        error: () => {
          this.errorMessage = 'No se ha podido guardar el ejercicio.';
          this.isSaving = false;
        },
      });
  }

  presentation(): TypePresentation {
    // Devuelve textos y CTA segun el tipo de entrada.
    if (this.type === 'cardio') {
      return {
        title: 'Datos de cardio',
        subtitle: 'Registra bloques con tiempo, distancia y ritmo',
        saveLabel: 'Guardar cardio',
      };
    }

    if (this.type === 'core') {
      return {
        title: 'Datos de abdomen',
        subtitle: 'Registra repeticiones o tiempo por serie',
        saveLabel: 'Guardar abdomen',
      };
    }

    return {
      title: 'Datos del ejercicio',
      subtitle: 'Registro flexible para ejercicios de tipo otro',
      saveLabel: 'Guardar ejercicio',
    };
  }

  typeLabel(): string {
    // Traduce el tipo interno a una etiqueta breve.
    return this.type === 'cardio' ? 'cardio' : this.type === 'core' ? 'abdomen' : 'otro';
  }

  private loadExercises(): void {
    // Carga ejercicios filtrados por el tipo activo.
    this.isLoading = true;
    this.errorMessage = null;

    this.exercisesFacade
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const items = Array.isArray(response?.items) ? response.items : [];
          this.exercises = items.filter((exercise) => exercise.type === this.type);
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

  private isSupportedType(type: string | null): type is SupportedType {
    // Valida que el segmento de ruta pertenezca al enum soportado.
    return type === 'cardio' || type === 'core' || type === 'other';
  }
}
