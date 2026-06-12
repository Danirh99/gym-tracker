import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SwCacheService {
  async invalidateUrl(urlContains: string): Promise<void> {
    if (typeof caches === 'undefined') {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      const swCaches = cacheNames.filter((name) => name.startsWith('ngsw:'));

      for (const name of swCaches) {
        const cache = await caches.open(name);
        const requests = await cache.keys();

        for (const request of requests) {
          if (request.url.includes(urlContains)) {
            await cache.delete(request);
          }
        }
      }
    } catch {
      // Si falla la API de cache, no bloqueamos la navegacion.
    }
  }
}
