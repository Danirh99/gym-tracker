import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ThemeService } from '../core/theme/theme.service';
import { SideMenuService } from './side-menu.service';

@Component({
  selector: 'app-side-menu',
  imports: [RouterLink, RouterLinkActive],
  styles: [
    `
    .side-menu-overlay {
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: linear-gradient(140deg, rgba(15, 23, 42, 0.56), rgba(15, 23, 42, 0.38));
      border: 0;
    }

    .side-menu-panel {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1210;
      height: 100vh;
      width: min(84vw, 320px);
      background:
        radial-gradient(120% 42% at 0% 0%, rgba(56, 189, 248, 0.16) 0%, rgba(56, 189, 248, 0) 70%),
        radial-gradient(80% 36% at 100% 100%, rgba(14, 165, 233, 0.1) 0%, rgba(14, 165, 233, 0) 72%),
        color-mix(in oklab, var(--color-surface) 94%, white 6%);
      box-shadow: none;
      transform: translateX(-100%);
      border-right: 1px solid color-mix(in oklab, var(--color-outline-variant) 75%, transparent);
      transition: transform 0.24s ease, box-shadow 0.24s ease;
    }

    .side-menu-panel.open {
      transform: translateX(0);
      box-shadow: 0 24px 56px rgba(2, 6, 23, 0.34);
    }

    .menu-card {
      border: 1px solid color-mix(in oklab, var(--color-outline-variant) 74%, transparent);
      background: color-mix(in oklab, var(--color-surface-container-lowest) 84%, white 16%);
      box-shadow: 0 14px 28px rgba(15, 23, 42, 0.07);
    }

    .menu-link,
    .theme-button {
      transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
    }

    .menu-link:hover,
    .theme-button:hover {
      transform: translateY(-1px);
    }

    .menu-link-active {
      background: color-mix(in oklab, var(--color-primary-container) 88%, white 12%);
      color: var(--color-on-primary-container);
      box-shadow: 0 10px 24px rgba(2, 132, 199, 0.2);
    }
  `,
  ],
  template: `
    @if (sideMenuService.isOpen) {
      <button
        aria-label="Cerrar menu"
        class="side-menu-overlay"
        (click)="sideMenuService.close()"
        type="button"
      ></button>
    }

    <aside
      [attr.aria-hidden]="!sideMenuService.isOpen"
      aria-label="Menu lateral"
      class="side-menu-panel"
      [class.open]="sideMenuService.isOpen"
    >
      <div class="border-b border-outline-variant/70 px-5 py-5">
        <div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container/75 text-on-primary-container shadow-[0_8px_22px_rgba(2,132,199,0.2)]">
          <span class="material-symbols-outlined filled-icon">tune</span>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-headline-md text-headline-md text-on-surface">Menu</h2>
            <p class="mt-1 font-label-sm text-label-sm text-on-surface-variant">Accesos rapidos y preferencias</p>
          </div>
        <button
          aria-label="Cerrar menu"
          class="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high active:scale-95"
          (click)="sideMenuService.close()"
          type="button"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
        </div>
      </div>

      <div class="space-y-4 p-5">
        <nav aria-label="Secciones" class="menu-card rounded-2xl p-2.5">
          <a
            class="menu-link flex items-center justify-between rounded-xl px-4 py-3 text-on-surface hover:bg-surface-container-high"
            routerLink="/"
            routerLinkActive="menu-link-active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="closeMenu()"
          >
            <span class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <span class="material-symbols-outlined text-[20px]">home</span>
              </span>
              <span class="font-label-md text-label-md">Inicio</span>
            </span>
            <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </a>
          <a
            class="menu-link flex items-center justify-between rounded-xl px-4 py-3 text-on-surface hover:bg-surface-container-high"
            routerLink="/exercises"
            routerLinkActive="menu-link-active"
            (click)="closeMenu()"
          >
            <span class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <span class="material-symbols-outlined text-[20px]">fitness_center</span>
              </span>
              <span class="font-label-md text-label-md">Ejercicios</span>
            </span>
            <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </a>
          <a
            class="menu-link flex items-center justify-between rounded-xl px-4 py-3 text-on-surface hover:bg-surface-container-high"
            routerLink="/calendar"
            routerLinkActive="menu-link-active"
            (click)="closeMenu()"
          >
            <span class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <span class="material-symbols-outlined text-[20px]">calendar_month</span>
              </span>
              <span class="font-label-md text-label-md">Calendario</span>
            </span>
            <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </a>
          <a
            class="menu-link flex items-center justify-between rounded-xl px-4 py-3 text-on-surface hover:bg-surface-container-high"
            routerLink="/charts"
            routerLinkActive="menu-link-active"
            (click)="closeMenu()"
          >
            <span class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <span class="material-symbols-outlined text-[20px]">equalizer</span>
              </span>
              <span class="font-label-md text-label-md">Gráficas</span>
            </span>
            <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </a>
          <a
            class="menu-link flex items-center justify-between rounded-xl px-4 py-3 text-on-surface hover:bg-surface-container-high"
            routerLink="/alerts"
            routerLinkActive="menu-link-active"
            (click)="closeMenu()"
          >
            <span class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <span class="material-symbols-outlined text-[20px]">notifications_active</span>
              </span>
              <span class="font-label-md text-label-md">Alertas</span>
            </span>
            <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </a>
        </nav>

        <button
          [attr.aria-label]="themeService.themeToggleAriaLabel()"
          [attr.aria-pressed]="themeService.isDarkTheme"
          class="theme-button menu-card flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-on-surface hover:bg-surface-container"
          (click)="themeService.toggleTheme()"
          type="button"
        >
          <span class="flex items-center gap-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/14 text-secondary">
              <span class="material-symbols-outlined text-[20px]">contrast</span>
            </span>
            <span class="font-label-md text-label-md">Tema</span>
          </span>
          <span class="flex items-center gap-2">
            <span class="font-label-sm text-label-sm text-on-surface-variant">{{ themeService.isDarkTheme ? 'Oscuro' : 'Claro' }}</span>
            <span class="material-symbols-outlined">{{ themeService.themeIconName() }}</span>
          </span>
        </button>
      </div>
    </aside>
  `,
})
export class SideMenuComponent {
  constructor(
    readonly sideMenuService: SideMenuService,
    readonly themeService: ThemeService,
  ) {}

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.sideMenuService.close();
  }

  closeMenu(): void {
    this.sideMenuService.close();
  }
}
