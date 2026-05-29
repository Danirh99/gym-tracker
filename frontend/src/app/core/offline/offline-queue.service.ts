import { Injectable, signal } from '@angular/core';

export type OfflineOperationStatus = 'pending' | 'syncing' | 'failed';

export interface OfflineOperation {
  id: string;
  createdAt: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: unknown;
  entityType: string;
  tempEntityId?: string | null;
  status: OfflineOperationStatus;
  retryCount: number;
  lastError: string | null;
  clientRequestId: string;
}

interface TempIdMapping {
  tempId: string;
  serverId: number;
  entityType: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  readonly pendingCount = signal(0);
  private readonly dbName = 'gym-tracker-offline';
  private readonly operationsStoreName = 'pending_operations';
  private readonly tempIdMapStoreName = 'temp_id_map';
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    void this.refreshPendingCount();
  }

  async enqueue(operation: Omit<OfflineOperation, 'id' | 'createdAt' | 'retryCount' | 'status' | 'lastError'>): Promise<string> {
    const completeOperation: OfflineOperation = {
      ...operation,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
      lastError: null,
    };
    const db = await this.getDb();
    await this.toPromise(this.operationsStore(db, 'readwrite').add(completeOperation));
    await this.refreshPendingCount();
    return completeOperation.id;
  }

  async getPendingOperations(): Promise<OfflineOperation[]> {
    const db = await this.getDb();
    const store = this.operationsStore(db, 'readonly');
    const allOperations = (await this.toPromise(store.getAll())) as OfflineOperation[];
    return allOperations.filter((item) => item.status === 'pending' || item.status === 'failed').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getAllOperations(): Promise<OfflineOperation[]> {
    const db = await this.getDb();
    const store = this.operationsStore(db, 'readonly');
    const allOperations = (await this.toPromise(store.getAll())) as OfflineOperation[];
    return allOperations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async markSyncing(id: string): Promise<void> {
    await this.updateOperation(id, (operation) => ({ ...operation, status: 'syncing' }));
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await this.updateOperation(id, (operation) => ({
      ...operation,
      status: 'failed',
      retryCount: operation.retryCount + 1,
      lastError: errorMessage,
    }));
    await this.refreshPendingCount();
  }

  async markPending(id: string): Promise<void> {
    await this.updateOperation(id, (operation) => ({
      ...operation,
      status: 'pending',
      lastError: null,
    }));
    await this.refreshPendingCount();
  }

  async remove(id: string): Promise<void> {
    const db = await this.getDb();
    await this.toPromise(this.operationsStore(db, 'readwrite').delete(id));
    await this.refreshPendingCount();
  }

  async registerTempIdMapping(tempId: string, serverId: number, entityType: string): Promise<void> {
    const db = await this.getDb();
    await this.toPromise(
      this.tempIdMapStore(db, 'readwrite').put({
        tempId,
        serverId,
        entityType,
        createdAt: new Date().toISOString(),
      } satisfies TempIdMapping),
    );
  }

  async resolveServerId(tempId: string): Promise<number | null> {
    const db = await this.getDb();
    const mapping = (await this.toPromise(this.tempIdMapStore(db, 'readonly').get(tempId))) as TempIdMapping | undefined;
    return mapping?.serverId ?? null;
  }

  async replaceTempIdReferences(tempId: string, serverId: number): Promise<void> {
    const db = await this.getDb();
    const store = this.operationsStore(db, 'readwrite');
    const allOperations = (await this.toPromise(store.getAll())) as OfflineOperation[];

    for (const operation of allOperations) {
      const updated = this.withReplacedTempId(operation, tempId, serverId);
      if (updated !== operation) {
        await this.toPromise(store.put(updated));
      }
    }
  }

  async refreshPendingCount(): Promise<void> {
    try {
      const operations = await this.getPendingOperations();
      this.pendingCount.set(operations.length);
    } catch {
      this.pendingCount.set(0);
    }
  }

  private async updateOperation(id: string, updater: (operation: OfflineOperation) => OfflineOperation): Promise<void> {
    const db = await this.getDb();
    const store = this.operationsStore(db, 'readwrite');
    const current = (await this.toPromise(store.get(id))) as OfflineOperation | undefined;
    if (!current) {
      return;
    }
    await this.toPromise(store.put(updater(current)));
  }

  private async getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB no esta disponible en este entorno');
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.operationsStoreName)) {
          db.createObjectStore(this.operationsStoreName, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.tempIdMapStoreName)) {
          db.createObjectStore(this.tempIdMapStoreName, { keyPath: 'tempId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('No se pudo abrir IndexedDB'));
    });
    return this.dbPromise;
  }

  private operationsStore(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
    return db.transaction(this.operationsStoreName, mode).objectStore(this.operationsStoreName);
  }

  private tempIdMapStore(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
    return db.transaction(this.tempIdMapStoreName, mode).objectStore(this.tempIdMapStoreName);
  }

  private withReplacedTempId(operation: OfflineOperation, tempId: string, serverId: number): OfflineOperation {
    const serverIdText = String(serverId);
    let changed = false;

    const endpoint = operation.endpoint.includes(tempId) ? operation.endpoint.replaceAll(tempId, serverIdText) : operation.endpoint;
    if (endpoint !== operation.endpoint) {
      changed = true;
    }

    const payload = this.deepReplaceValue(operation.payload, tempId, serverIdText, () => {
      changed = true;
    });

    if (!changed) {
      return operation;
    }

    return {
      ...operation,
      endpoint,
      payload,
      tempEntityId: operation.tempEntityId === tempId ? null : operation.tempEntityId,
    };
  }

  private deepReplaceValue(value: unknown, search: string, replacement: string, onChange: () => void): unknown {
    if (typeof value === 'string') {
      const replaced = value.replaceAll(search, replacement);
      if (replaced !== value) {
        onChange();
      }
      return replaced;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.deepReplaceValue(item, search, replacement, onChange));
    }

    if (value !== null && typeof value === 'object') {
      const output: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value)) {
        output[key] = this.deepReplaceValue(item, search, replacement, onChange);
      }
      return output;
    }

    return value;
  }

  private toPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Error de IndexedDB'));
    });
  }
}
