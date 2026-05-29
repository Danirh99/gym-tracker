import { Injectable, signal } from '@angular/core';
import { WorkoutEntry, WorkoutSession } from '../session.model';

@Injectable()
export class SessionDetailStore {
  /** Sesion actualmente mostrada en detalle. */
  readonly session = signal<WorkoutSession | null>(null);

  /** Indicador de carga de pantalla. */
  readonly isLoading = signal(true);

  /** Error de carga/borrado para feedback de UI. */
  readonly errorMessage = signal<string | null>(null);

  /** Controla modal para elegir tipo de ejercicio a agregar. */
  readonly showExerciseTypeModal = signal(false);

  /** Controla dialogo de confirmacion para borrar entrada. */
  readonly showDeleteDialog = signal(false);

  /** Estado transitorio durante el borrado remoto. */
  readonly isDeletingEntry = signal(false);

  /** Entrada candidata a borrado cuando se abre el dialogo. */
  readonly entryPendingDeletion = signal<WorkoutEntry | null>(null);

  setLoading(isLoading: boolean): void {
    // Actualiza el indicador de carga de la pantalla.
    this.isLoading.set(isLoading);
  }

  setError(message: string | null): void {
    // Publica o limpia el error visible.
    this.errorMessage.set(message);
  }

  setSession(session: WorkoutSession | null): void {
    // Reemplaza la sesion cargada en memoria.
    this.session.set(session);
  }

  openExerciseTypeModal(): void {
    // Muestra el modal de tipos de ejercicio.
    this.showExerciseTypeModal.set(true);
  }

  closeExerciseTypeModal(): void {
    // Oculta el modal de tipos de ejercicio.
    this.showExerciseTypeModal.set(false);
  }

  openDeleteDialog(entry: WorkoutEntry): void {
    // Prepara el dialogo de borrado para una entrada concreta.
    this.entryPendingDeletion.set(entry);
    this.showDeleteDialog.set(true);
  }

  closeDeleteDialog(): void {
    // Limpia la seleccion y cierra el dialogo.
    this.entryPendingDeletion.set(null);
    this.showDeleteDialog.set(false);
  }

  startDeleting(): void {
    // Bloquea interacciones mientras se procesa el borrado.
    this.isDeletingEntry.set(true);
    this.errorMessage.set(null);
  }

  finishDeleting(nextSession: WorkoutSession | null): void {
    // Sincroniza el estado tras completar el borrado.
    if (nextSession !== null) {
      this.session.set(nextSession);
    }

    this.isDeletingEntry.set(false);
    this.entryPendingDeletion.set(null);
    this.showDeleteDialog.set(false);
  }
}
