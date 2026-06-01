import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { OfflineQueueService } from './core/offline/offline-queue.service';
import { OfflineStatusService } from './core/offline/offline-status.service';
import { OfflineSyncService } from './core/offline/offline-sync.service';
import { SideMenuComponent } from './shared/side-menu.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, SideMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(
    readonly offlineStatusService: OfflineStatusService,
    readonly offlineQueueService: OfflineQueueService,
    readonly offlineSyncService: OfflineSyncService,
  ) {
    void this.offlineSyncService.syncPendingOperations();
  }
}
