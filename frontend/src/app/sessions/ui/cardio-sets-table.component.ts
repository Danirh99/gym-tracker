import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface CardioSetRow {
  setNumber: number;
  durationMinutes: string;
  distanceKm: string;
  speedKmh: string;
  incline: string;
  resistanceLevel: string;
  calories: string;
}

@Component({
  selector: 'app-cardio-sets-table',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cardio-sets-table.component.html',
})
export class CardioSetsTableComponent {
  @Input({ required: true }) sets: CardioSetRow[] = [];

  @Output() removeRequested = new EventEmitter<number>();

  requestRemove(index: number): void {
    // Notifica la eliminacion de una serie cardio.
    this.removeRequested.emit(index);
  }
}
