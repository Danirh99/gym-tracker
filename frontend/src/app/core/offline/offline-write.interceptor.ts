import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { WorkoutSessionResponse } from '../../sessions/session.model';
import { OfflineQueueService } from './offline-queue.service';
import { OfflineSyncService } from './offline-sync.service';

export const offlineWriteInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const queueService = inject(OfflineQueueService);
  const syncService = inject(OfflineSyncService);

  if (!isWriteRequest(request)) {
    return next(request);
  }

  if (request.url === '/api/backups/import') {
    return next(request);
  }

  if (navigator.onLine) {
    void syncService.syncPendingOperations();
    return next(request);
  }

  if (request.method === 'POST' && request.url === '/api/workout-sessions') {
    return from(
      queueService.enqueue({
        endpoint: request.url,
        method: 'POST',
        payload: request.body,
        entityType: 'session',
        tempEntityId: `tmp-${Date.now()}`,
        clientRequestId: crypto.randomUUID(),
      }),
    ).pipe(
      switchMap(() => {
        const response: WorkoutSessionResponse = {
          item: {
            id: -Date.now(),
            name: ((request.body as { name?: string | null } | null)?.name ?? null) as string | null,
            displayName: ((request.body as { name?: string | null } | null)?.name ?? 'Sesion pendiente') as string,
            sessionDate: ((request.body as { sessionDate?: string } | null)?.sessionDate ?? new Date().toISOString().slice(0, 10)) as string,
            mood: ((request.body as { mood?: WorkoutSessionResponse['item']['mood'] } | null)?.mood ?? null) as WorkoutSessionResponse['item']['mood'],
            moodLabel: null,
            notes: ((request.body as { notes?: string | null } | null)?.notes ?? null) as string | null,
            startedAt: null,
            finishedAt: null,
            exerciseCount: 0,
            setCount: 0,
            totalVolumeKg: 0,
            cardioDurationSeconds: 0,
            entries: [],
          },
        };

        return of(
          new HttpResponse({
            status: 202,
            body: response,
            headers: request.headers.set('x-offline-queued', '1'),
          }),
        );
      }),
    );
  }

  return from(
    queueService.enqueue({
      endpoint: request.url,
      method: request.method as 'POST' | 'PUT' | 'DELETE',
      payload: request.body,
      entityType: 'generic',
      tempEntityId: null,
      clientRequestId: crypto.randomUUID(),
    }),
  ).pipe(
    switchMap(() =>
      of(
        new HttpResponse({
          status: 202,
          body: {},
          headers: request.headers.set('x-offline-queued', '1'),
        }),
      ),
    ),
  );
};

function isWriteRequest(request: HttpRequest<unknown>): boolean {
  return request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE';
}
