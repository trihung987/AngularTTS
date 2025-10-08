// src/app.ts

import { Component, Inject, OnInit, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, Router, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter, first } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None,
})
export class App {
  isBrowser = false;
  isProtectedRoute = false;

  constructor(@Inject(PLATFORM_ID) platformId: Object, private router: Router) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const currentUrl = this.router.url;
        this.isProtectedRoute = currentUrl.startsWith('/admin'); // hoặc list route
      });
  }
}
