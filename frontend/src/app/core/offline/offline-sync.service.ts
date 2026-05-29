import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { OfflineOperation, OfflineQueueService } from './offline-queue.service';

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private syncInProgress = false;
  private successDismissStartTimeoutId: number | null = null;
  private successDismissEndTimeoutId: number | null = null;
  readonly isSyncing = signal(false);
  readonly isSuccessDismissing = signal(false);
  readonly lastSyncAt = signal<string | null>(null);
  readonly lastSyncResult = signal<'idle' | 'success' | 'error'>('idle');
  readonly lastSyncError = signal<string | null>(null);
  readonly syncedOperations = signal(0);

  constructor(
    private readonly http: HttpClient,
    private readonly offlineQueueService: OfflineQueueService,
  ) {
    window.addEventListener('online', () => {
      void this.syncPendingOperations();
    });
  }

  async syncPendingOperations(): Promise<void> {
    if (!navigator.onLine || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    this.isSyncing.set(true);
    this.clearSuccessAutoHide();
    this.isSuccessDismissing.set(false);
    this.lastSyncAt.set(new Date().toISOString());
    this.lastSyncError.set(null);
    const queue = await this.offlineQueueService.getPendingOperations();
    let hadErrors = false;
    let successCount = 0;

    for (const operation of queue) {
      const synced = await this.syncOperation(operation);
      if (synced) {
        successCount += 1;
      } else {
        hadErrors = true;
      }
    }

    this.syncInProgress = false;
    this.isSyncing.set(false);
    this.syncedOperations.update((count) => count + successCount);
    this.lastSyncResult.set(hadErrors ? 'error' : 'success');
    if (!hadErrors && navigator.onLine) {
      this.scheduleSuccessAutoHide();
    }
    await this.offlineQueueService.refreshPendingCount();
  }

  private async syncOperation(operation: OfflineOperation): Promise<boolean> {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      await this.offlineQueueService.markSyncing(operation.id);

      try {
        await this.executeOperation(operation);
        await this.offlineQueueService.remove(operation.id);
        return true;
      } catch (error) {
        const recoverable = this.isRecoverableError(error);
        const isLastAttempt = attempt === maxRetries;

        if (!recoverable || isLastAttempt) {
          const message = `${recoverable ? 'Error transitorio agotado' : 'Error no recuperable'}: ${this.errorMessage(error)}`;
          this.clearSuccessAutoHide();
          this.lastSyncError.set(message);
          await this.offlineQueueService.markFailed(operation.id, message);
          return false;
        }

        await this.wait(this.retryDelayMs(attempt));
      }
    }

    return false;
  }

  private async executeOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.method) {
      case 'POST':
        await this.executePost(operation);
        return;
      case 'PUT':
        await firstValueFrom(
          this.http.put(operation.endpoint, operation.payload, {
            headers: this.requestHeaders(operation.clientRequestId),
          }),
        );
        return;
      case 'DELETE':
        await firstValueFrom(
          this.http.delete(operation.endpoint, {
            headers: this.requestHeaders(operation.clientRequestId),
          }),
        );
        return;
      default:
        throw new Error(`Metodo no soportado: ${operation.method as string}`);
    }
  }

  private async executePost(operation: OfflineOperation): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<{ item?: { id?: number } }>(operation.endpoint, operation.payload, {
        headers: this.requestHeaders(operation.clientRequestId),
      }),
    );
    const serverId = response?.item?.id;
    if (!operation.tempEntityId || typeof serverId !== 'number') {
      return;
    }

    await this.offlineQueueService.registerTempIdMapping(operation.tempEntityId, serverId, operation.entityType);
    await this.offlineQueueService.replaceTempIdReferences(operation.tempEntityId, serverId);
  }

  private requestHeaders(clientRequestId: string): HttpHeaders {
    return new HttpHeaders({ 'x-client-request-id': clientRequestId });
  }

  private isRecoverableError(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    if (error.status === 0) {
      return true;
    }

    return error.status >= 500;
  }

  private retryDelayMs(attempt: number): number {
    return Math.min(1000 * 2 ** (attempt - 1), 8000);
  }

  private async wait(ms: number): Promise<void> {
    await new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  private scheduleSuccessAutoHide(): void {
    this.clearSuccessAutoHide();
    this.successDismissStartTimeoutId = window.setTimeout(() => {
      if (navigator.onLine && !this.isSyncing() && this.lastSyncResult() === 'success') {
        this.isSuccessDismissing.set(true);
        this.successDismissEndTimeoutId = window.setTimeout(() => {
          this.lastSyncResult.set('idle');
          this.isSuccessDismissing.set(false);
          this.successDismissEndTimeoutId = null;
        }, 450);
      }
      this.successDismissStartTimeoutId = null;
    }, 2200);
  }

  private clearSuccessAutoHide(): void {
    if (this.successDismissStartTimeoutId !== null) {
      window.clearTimeout(this.successDismissStartTimeoutId);
      this.successDismissStartTimeoutId = null;
    }
    if (this.successDismissEndTimeoutId !== null) {
      window.clearTimeout(this.successDismissEndTimeoutId);
      this.successDismissEndTimeoutId = null;
    }
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Error desconocido al sincronizar';
  }
}
