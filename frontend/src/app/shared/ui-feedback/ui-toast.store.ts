import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error';

@Injectable()
/** Estado efimero para mensajes toast de la UI. */
export class UiToastStore {
  /** Texto visible del toast actual. */
  readonly message = signal<string | null>(null);

  /** Variante visual asociada al mensaje activo. */
  readonly tone = signal<ToastTone>('success');

  /** Temporizador activo para limpiar el mensaje automaticamente. */
  private timeoutId: number | null = null;

  show(message: string, tone: ToastTone, durationMs = 2800): void {
    // Sustituye cualquier toast anterior y reinicia su caducidad.
    this.tone.set(tone);
    this.message.set(message);

    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      // Borra el mensaje cuando expira el tiempo visible.
      this.message.set(null);
      this.timeoutId = null;
    }, durationMs);
  }
}
