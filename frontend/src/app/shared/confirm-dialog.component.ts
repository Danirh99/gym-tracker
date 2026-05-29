import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  host: { class: 'contents' },
  templateUrl: './confirm-dialog.component.html',
})
/** Dialogo reutilizable para confirmar acciones destructivas. */
export class ConfirmDialogComponent {
  /** Titulo principal que resume la accion a confirmar. */
  @Input({ required: true }) title = '';
  /** Mensaje explicativo que detalla el efecto de la accion. */
  @Input({ required: true }) message = '';
  /** Texto del boton primario. */
  @Input() confirmLabel = 'Confirmar';
  /** Texto del boton secundario. */
  @Input() cancelLabel = 'Cancelar';
  /** Permite variar el estilo del boton primario segun el riesgo. */
  @Input() tone: 'default' | 'danger' = 'default';
  /** Bloquea cierre y confirmacion mientras la accion esta en curso. */
  @Input() isPending = false;

  /** Emite cuando el usuario confirma. */
  @Output() confirmed = new EventEmitter<void>();
  /** Emite cuando el usuario cancela el dialogo. */
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  closeWithEscape(): void {
    // Reutiliza la misma salida que el boton cancelar.
    this.close();
  }

  close(): void {
    // Evita que el dialogo desaparezca mientras la peticion sigue viva.
    if (!this.isPending) {
      this.closed.emit();
    }
  }

  confirm(): void {
    // Solo permite confirmar cuando no hay una operacion bloqueante.
    if (!this.isPending) {
      this.confirmed.emit();
    }
  }
}
