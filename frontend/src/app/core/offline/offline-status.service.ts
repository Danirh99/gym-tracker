import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OfflineStatusService {
  readonly isOnline = signal(navigator.onLine);

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private readonly handleOnline = () => {
    this.isOnline.set(true);
  };

  private readonly handleOffline = () => {
    this.isOnline.set(false);
  };
}
