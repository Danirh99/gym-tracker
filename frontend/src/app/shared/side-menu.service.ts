import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SideMenuService {
  isOpen = false;

  open(): void {
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }
}
