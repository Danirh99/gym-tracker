import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface StrengthSetRow {
  setNumber: number;
  weightKg: string;
  reps: string;
}

@Component({
  selector: 'app-strength-sets-table',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './strength-sets-table.component.html',
})
export class StrengthSetsTableComponent {
  @Input({ required: true }) sets: StrengthSetRow[] = [];

  @Output() removeRequested = new EventEmitter<number>();

  requestRemove(index: number): void {
    // Notifica a la pantalla que se solicito eliminar una fila.
    this.removeRequested.emit(index);
  }
}
