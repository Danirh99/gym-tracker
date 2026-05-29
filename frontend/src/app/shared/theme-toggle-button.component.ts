import { Component } from '@angular/core';
import { ThemeService } from '../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle-button',
  template: `
    <button
      [attr.aria-label]="themeService.themeToggleAriaLabel()"
      [attr.aria-pressed]="themeService.isDarkTheme"
      class="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high active:scale-95"
      (click)="themeService.toggleTheme()"
      type="button"
    >
      <span class="material-symbols-outlined">{{ themeService.themeIconName() }}</span>
    </button>
  `,
})
export class ThemeToggleButtonComponent {
  constructor(readonly themeService: ThemeService) {}
}
