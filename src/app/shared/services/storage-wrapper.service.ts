import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageWrapperService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  setItem(key: string, value: any): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('Error setting item in localStorage:', e);
        // Handle error, e.g., fall back to in-memory storage
      }
    }
  }

  getItem(key: string): any | null {
    if (this.isBrowser) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error('Error getting item from localStorage:', e);
        return null;
      }
    }
    return null; // Return null if not in a browser environment
  }

  removeItem(key: string): void {
    if (this.isBrowser) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Error removing item from localStorage:', e);
      }
    }
  }

  clear(): void {
    if (this.isBrowser) {
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    }
  }
}
