import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Exercise } from '../../exercises/exercise.model';

@Component({
  selector: 'app-exercise-selector',
  standalone: true,
  imports: [NgClass],
  templateUrl: './exercise-selector.component.html',
})
export class ExerciseSelectorComponent {
  @Input({ required: true }) exercises: Exercise[] = [];

  @Input() selectedExerciseId: number | null = null;

  @Input() emptyMessage = 'No hay ejercicios que coincidan con la búsqueda.';

  @Input() compactMeta = false;

  @Input() variant: 'card' | 'compact' = 'card';

  @Input() scrollable = false;

  @Output() exerciseSelected = new EventEmitter<Exercise>();

  isSelected(exerciseId: number): boolean {
    // Compara el elemento actual con el seleccionado.
    return this.selectedExerciseId === exerciseId;
  }

  selectExercise(exercise: Exercise): void {
    // Emite el ejercicio elegido a la pantalla padre.
    this.exerciseSelected.emit(exercise);
  }

  trackExercise(_: number, exercise: Exercise): number {
    // Mantiene estable la clave de render de cada ejercicio.
    return exercise.id;
  }
}
