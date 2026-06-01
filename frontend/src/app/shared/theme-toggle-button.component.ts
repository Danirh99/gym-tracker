import { Component } from '@angular/core';
import { SideMenuService } from './side-menu.service';

@Component({
  selector: 'app-theme-toggle-button',
  template: `
    <button
      aria-label="Abrir menu"
      [attr.aria-expanded]="sideMenuService.isOpen"
      class="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high active:scale-95"
      (click)="sideMenuService.toggle()"
      type="button"
    >
      <span class="material-symbols-outlined">menu</span>
    </button>
  `,
})
export class ThemeToggleButtonComponent {
  constructor(readonly sideMenuService: SideMenuService) {}
}
