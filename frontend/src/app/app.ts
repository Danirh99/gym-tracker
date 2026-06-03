import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { OfflineSyncService } from './core/offline/offline-sync.service';
import { SideMenuComponent } from './shared/side-menu.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SideMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly #offlineSyncService = inject(OfflineSyncService);

  ngOnInit(): void {
    void this.#offlineSyncService.syncPendingOperations();
  }
}
