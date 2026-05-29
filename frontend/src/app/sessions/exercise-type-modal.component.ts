import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { ExerciseType } from './session.model';

interface ExerciseTypeOption {
  type: ExerciseType;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-exercise-type-modal',
  host: { class: 'contents' },
  templateUrl: './exercise-type-modal.component.html',
})
export class ExerciseTypeModalComponent {
  readonly options: ExerciseTypeOption[] = [
    { type: 'strength', label: 'Fuerza', description: 'Peso y repeticiones por serie', icon: 'fitness_center' },
    { type: 'cardio', label: 'Cardio', description: 'Tiempo, distancia y ritmo', icon: 'directions_run' },
    { type: 'core', label: 'Abdomen', description: 'Series por repeticiones o tiempo', icon: 'self_improvement' },
    { type: 'other', label: 'Otros', description: 'Registro flexible de series', icon: 'exercise' },
  ];

  @Output() selected = new EventEmitter<ExerciseType>();
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  closeWithEscape(): void {
    // Cierra el modal con Escape para mejorar la usabilidad.
    this.closed.emit();
  }

  select(type: ExerciseType): void {
    // Emite el tipo elegido al contenedor.
    this.selected.emit(type);
  }
}
