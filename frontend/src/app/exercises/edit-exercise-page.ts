import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';
import { ExerciseType } from './exercise.model';
import { ExerciseFormStore } from './state/exercise-form.store';
import { ExercisesFacade } from './state/exercises.facade';

@Component({
  selector: 'app-edit-exercise-page',
  imports: [ConfirmDialogComponent, ReactiveFormsModule, RouterLink, ThemeToggleButtonComponent],
  templateUrl: './edit-exercise-page.html',
  providers: [ExerciseFormStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditExercisePage implements OnInit {
  /** Identificador de ejercicio en edicion obtenido desde la ruta. */
  exerciseId: number | null = null;
  /** Estado de carga inicial del ejercicio. */
  isLoading = true;
  /** Estado de guardado para deshabilitar UI mientras persiste. */
  isSubmitting = false;
  /** Estado de borrado para bloquear acciones conflictivas. */
  isDeleting = false;
  /** Controla visibilidad del dialogo de confirmacion de borrado. */
  showDeleteDialog = false;
  /** Error de carga/guardado/borrado mostrado al usuario. */
  errorMessage: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly exercisesFacade: ExercisesFacade,
    private readonly changeDetectorRef: ChangeDetectorRef,
    readonly formStore: ExerciseFormStore,
  ) {}

  get form() {
    return this.formStore.form;
  }

  get typeOptions() {
    return this.formStore.typeOptions;
  }

  ngOnInit(): void {
    // Interpreta y valida el id de ruta para evitar llamadas invalidas.
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = rawId === null ? NaN : Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'El ejercicio no es válido.';
      this.isLoading = false;
      return;
    }

    this.exerciseId = id;
    this.loadExercise(id);
  }

  selectType(type: ExerciseType): void {
    this.formStore.selectType(type);
  }

  submit(): void {
    // Dispara validacion visual del formulario antes de persistir.
    this.formStore.form.markAllAsTouched();

    // Corta ejecucion ante estados incompatibles.
    if (this.formStore.form.invalid || this.isSubmitting || this.isDeleting || this.exerciseId === null) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    // Serializa el formulario a contrato de API.
    const payload = this.formStore.toPayload();

    this.exercisesFacade
      .update(this.exerciseId, payload)
      .subscribe({
        next: () => {
          window.sessionStorage.setItem('exerciseToast', `Ejercicio actualizado: ${payload.name}`);
          void this.router.navigate(['/exercises']);
        },
        error: () => {
          this.errorMessage = 'No se han podido guardar los cambios.';
          this.isSubmitting = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  showNameError(): boolean {
    return this.formStore.showNameError();
  }

  openDeleteDialog(): void {
    // Solo permite abrir el dialogo cuando el estado es consistente.
    if (this.exerciseId !== null && !this.isSubmitting && !this.isDeleting) {
      this.showDeleteDialog = true;
    }
  }

  closeDeleteDialog(): void {
    if (!this.isDeleting) {
      this.showDeleteDialog = false;
    }
  }

  deleteExercise(): void {
    // Protege contra estados invalidos o operaciones simultaneas.
    if (this.exerciseId === null || this.isSubmitting || this.isDeleting) {
      return;
    }

    const exerciseName = this.form.controls.name.value.trim();
    this.isDeleting = true;
    this.errorMessage = null;

    this.exercisesFacade.delete(this.exerciseId).subscribe({
      next: () => {
        const message = exerciseName === '' ? 'Ejercicio eliminado' : `Ejercicio eliminado: ${exerciseName}`;
        window.sessionStorage.setItem('exerciseToast', message);
        void this.router.navigate(['/exercises']);
      },
      error: () => {
        this.errorMessage = 'No se ha podido borrar el ejercicio.';
        this.isDeleting = false;
        this.showDeleteDialog = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  private loadExercise(id: number): void {
    // Carga el ejercicio y rellena el formulario para edicion.
    this.isLoading = true;
    this.errorMessage = null;

    this.exercisesFacade.detail(id).subscribe({
      next: ({ item }) => {
        this.formStore.setFromExercise(item);
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se ha podido cargar el ejercicio.';
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }
}
