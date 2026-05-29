import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OfflineOperation, OfflineQueueService } from '../core/offline/offline-queue.service';
import { OfflineStatusService } from '../core/offline/offline-status.service';
import { OfflineSyncService } from '../core/offline/offline-sync.service';

@Component({
  selector: 'app-offline-center-page',
  imports: [RouterLink],
  templateUrl: './offline-center-page.html',
})
export class OfflineCenterPage implements OnInit {
  operations: OfflineOperation[] = [];
  isLoading = false;
  feedbackMessage: string | null = null;
  feedbackTone: 'success' | 'error' = 'success';

  constructor(
    readonly offlineStatusService: OfflineStatusService,
    readonly offlineSyncService: OfflineSyncService,
    private readonly offlineQueueService: OfflineQueueService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.isLoading = true;
    this.operations = await this.offlineQueueService.getAllOperations();
    this.isLoading = false;
    this.changeDetectorRef.markForCheck();
  }

  async syncNow(): Promise<void> {
    if (!this.offlineStatusService.isOnline()) {
      this.showFeedback('Sin conexion. No se puede sincronizar ahora.', 'error');
      return;
    }

    await this.offlineSyncService.syncPendingOperations();
    await this.reload();
    this.showFeedback(this.offlineSyncService.lastSyncResult() === 'error' ? 'Sincronizacion finalizada con errores.' : 'Sincronizacion completada.', this.offlineSyncService.lastSyncResult() === 'error' ? 'error' : 'success');
  }

  async retryOperation(operationId: string): Promise<void> {
    await this.offlineQueueService.markPending(operationId);
    await this.syncNow();
  }

  async discardOperation(operationId: string): Promise<void> {
    await this.offlineQueueService.remove(operationId);
    await this.reload();
    this.showFeedback('Operacion descartada.', 'success');
  }

  formatDate(value: string | null): string {
    if (value === null) {
      return '-';
    }
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  statusLabel(status: OfflineOperation['status']): string {
    if (status === 'pending') {
      return 'Pendiente';
    }
    if (status === 'syncing') {
      return 'Sincronizando';
    }
    return 'Fallida';
  }

  canRetry(status: OfflineOperation['status']): boolean {
    return status === 'failed' || status === 'pending';
  }

  private showFeedback(message: string, tone: 'success' | 'error'): void {
    this.feedbackMessage = message;
    this.feedbackTone = tone;
    window.setTimeout(() => {
      this.feedbackMessage = null;
      this.changeDetectorRef.markForCheck();
    }, 2500);
  }
}
