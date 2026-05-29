import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';
import { ExercisesFacade } from './state/exercises.facade';
import { ExerciseFormStore } from './state/exercise-form.store';

@Component({
  selector: 'app-create-exercise-page',
  imports: [ReactiveFormsModule, RouterLink, ThemeToggleButtonComponent],
  templateUrl: './create-exercise-page.html',
  providers: [ExerciseFormStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateExercisePage {
  /** Estado visual del submit para deshabilitar acciones concurrentes. */
  isSubmitting = false;
  /** Mensaje de error de red/validacion de backend. */
  errorMessage: string | null = null;

  constructor(
    private readonly exercisesFacade: ExercisesFacade,
    readonly formStore: ExerciseFormStore,
    private readonly router: Router,
  ) {}

  get form() {
    // Delega la estructura del formulario al store compartido.
    return this.formStore.form;
  }

  get typeOptions() {
    // Reutiliza la misma configuracion de tipos usada en create/edit.
    return this.formStore.typeOptions;
  }

  selectType(type: (typeof this.typeOptions)[number]['value']): void {
    this.formStore.selectType(type);
  }

  submit(): void {
    // Fuerza validacion visual antes de intentar persistir.
    this.formStore.form.markAllAsTouched();

    // Evita dobles envios y peticiones con formulario invalido.
    if (this.formStore.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    // Construye payload normalizado desde el estado del formulario.
    const payload = this.formStore.toPayload();

    this.exercisesFacade
      .create(payload)
      .subscribe({
        next: () => {
          // Publica feedback para la pantalla de listado tras redireccion.
          window.sessionStorage.setItem('exerciseToast', `Ejercicio creado: ${payload.name}`);
          void this.router.navigate(['/exercises']);
        },
        error: () => {
          this.errorMessage = 'No se ha podido guardar el ejercicio.';
          this.isSubmitting = false;
        },
      });
  }

  showNameError(): boolean {
    return this.formStore.showNameError();
  }
}
