import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeStorageKey = 'gym-tracker-theme';
  private themeTransitionTimer: ReturnType<typeof setTimeout> | null = null;

  isDarkTheme = false;

  constructor() {
    this.initTheme();
  }

  toggleTheme(): void {
    this.applyTheme(!this.isDarkTheme);
  }

  themeToggleAriaLabel(): string {
    return this.isDarkTheme ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  }

  themeIconName(): string {
    return this.isDarkTheme ? 'light_mode' : 'dark_mode';
  }

  private initTheme(): void {
    const storedTheme = this.getStoredTheme();

    if (storedTheme === 'dark') {
      this.applyTheme(true);
      return;
    }

    if (storedTheme === 'light') {
      this.applyTheme(false);
      return;
    }

    const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(prefersDark);
  }

  private applyTheme(isDark: boolean): void {
    this.isDarkTheme = isDark;

    const root = document.documentElement;
    root.classList.add('theme-transition');

    if (this.themeTransitionTimer !== null) {
      clearTimeout(this.themeTransitionTimer);
    }

    this.themeTransitionTimer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 320);

    if (isDark) {
      root.classList.add('dark');
      this.setStoredTheme('dark');
      return;
    }

    root.classList.remove('dark');
    this.setStoredTheme('light');
  }

  private getStoredTheme(): 'dark' | 'light' | null {
    if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
      return null;
    }

    const value = localStorage.getItem(this.themeStorageKey);
    return value === 'dark' || value === 'light' ? value : null;
  }

  private setStoredTheme(theme: 'dark' | 'light'): void {
    if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') {
      return;
    }

    localStorage.setItem(this.themeStorageKey, theme);
  }
}
