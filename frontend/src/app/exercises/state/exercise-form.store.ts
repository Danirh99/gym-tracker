import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { normalizeOptionalString } from '../../core/utils/string.utils';
import { Exercise, ExerciseType } from '../exercise.model';

export interface ExerciseFormPayload {
  name: string;
  type: ExerciseType;
  muscleGroups: string[];
  notes: string | null;
}

@Injectable()
export class ExerciseFormStore {
  /** Opciones visibles para seleccionar tipo de ejercicio. */
  readonly typeOptions: Array<{ value: ExerciseType; label: string }> = [
    { value: 'strength', label: 'Fuerza' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'core', label: 'Abdomen' },
    { value: 'other', label: 'Otro' },
  ];

  /** Formulario reactivo centralizado para alta/edicion de ejercicios. */
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    type: new FormControl<ExerciseType>('strength', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    muscleGroups: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  selectType(type: ExerciseType): void {
    // Actualiza el tipo del formulario cuando se pulsa un chip.
    this.form.controls.type.setValue(type);
  }

  showNameError(): boolean {
    // Expone el estado de error del nombre solo tras interaccion del usuario.
    const control = this.form.controls.name;

    return control.invalid && (control.dirty || control.touched);
  }

  toPayload(): ExerciseFormPayload {
    // Convierte el estado del formulario al contrato que espera la API.
    const value = this.form.getRawValue();

    return {
      name: value.name.trim(),
      type: value.type,
      muscleGroups: this.parseMuscleGroups(value.muscleGroups),
      notes: normalizeOptionalString(value.notes),
    };
  }

  setFromExercise(item: Exercise): void {
    // Hidrata el formulario desde el ejercicio cargado en edicion.
    this.form.setValue({
      name: item.name,
      type: item.type,
      muscleGroups: item.muscleGroups.join(', '),
      notes: item.notes ?? '',
    });
  }

  private parseMuscleGroups(value: string): string[] {
    // Normaliza una lista CSV en valores unicos sin vacios.
    const uniqueGroups = new Set<string>();

    value
      .split(',')
      .map((muscleGroup) => muscleGroup.trim())
      .filter((muscleGroup) => muscleGroup !== '')
      .forEach((muscleGroup) => uniqueGroups.add(muscleGroup));

    return [...uniqueGroups];
  }
}
