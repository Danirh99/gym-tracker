import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { todayIsoDate } from '../core/utils/date.utils';
import { normalizeOptionalString } from '../core/utils/string.utils';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';
import { WorkoutMood } from './session.model';
import { WorkoutSessionsFacade } from './state/workout-sessions.facade';

interface MoodOption {
  value: WorkoutMood;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-new-session-page',
  imports: [ReactiveFormsModule, RouterLink, ThemeToggleButtonComponent],
  templateUrl: './new-session-page.html',
})
export class NewSessionPage {
  readonly moodOptions: MoodOption[] = [
    { value: 'mala', label: 'Mala', icon: 'sentiment_very_dissatisfied' },
    { value: 'normal', label: 'Normal', icon: 'sentiment_neutral' },
    { value: 'buena', label: 'Buena', icon: 'sentiment_satisfied' },
    { value: 'muy_buena', label: 'Muy buena', icon: 'local_fire_department' },
  ];

  readonly form = new FormGroup({
    sessionDate: new FormControl(this.today(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
    mood: new FormControl<WorkoutMood>('buena', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    notes: new FormControl('', { nonNullable: true }),
  });

  isSubmitting = false;
  errorMessage: string | null = null;

  constructor(
    private readonly workoutSessionsFacade: WorkoutSessionsFacade,
    private readonly router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  selectMood(mood: WorkoutMood): void {
    // Sincroniza el mood seleccionado con el formulario.
    this.form.controls.mood.setValue(mood);
  }

  submit(): void {
    // Fuerza validacion antes de intentar crear la sesion.
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const value = this.form.getRawValue();

    this.workoutSessionsFacade
      .create({
        sessionDate: value.sessionDate,
        name: normalizeOptionalString(value.name),
        mood: value.mood,
        notes: normalizeOptionalString(value.notes),
      })
      .subscribe({
        next: ({ item }) => {
          if (item.id < 0) {
            window.sessionStorage.setItem('sessionToast', 'Sesion guardada offline. Se sincronizara al volver la conexion.');
            void this.router.navigate(['/sessions']);
            return;
          }

          void this.router.navigate(['/sessions', item.id]);
        },
        error: () => {
          this.errorMessage = 'No se ha podido crear la sesión.';
          this.isSubmitting = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  showDateError(): boolean {
    // Muestra error solo si el usuario ya interactuo.
    const control = this.form.controls.sessionDate;

    return control.invalid && (control.dirty || control.touched);
  }

  showNameError(): boolean {
    // Muestra error del nombre con la misma regla visual.
    const control = this.form.controls.name;

    return control.invalid && (control.dirty || control.touched);
  }
  private today(): string {
    // Valor inicial del formulario para la fecha actual.
    return todayIsoDate();
  }
}
