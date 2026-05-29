import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface CoreOtherSetRow {
  setNumber: number;
  reps: string;
  durationSeconds: string;
  notes: string;
}

@Component({
  selector: 'app-core-other-sets-table',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './core-other-sets-table.component.html',
})
export class CoreOtherSetsTableComponent {
  @Input({ required: true }) sets: CoreOtherSetRow[] = [];

  @Output() removeRequested = new EventEmitter<number>();

  requestRemove(index: number): void {
    // Notifica la eliminacion de una serie de core/otros.
    this.removeRequested.emit(index);
  }
}
