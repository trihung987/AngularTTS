import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ROUTER_CONFIGURATION } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { authInterceptor } from './core/guard/auth.interceptor';
import { provideServerRendering } from '@angular/ssr';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideNgxSkeletonLoader } from 'ngx-skeleton-loader';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { routes } from './app.routes';
import { ConfirmationService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(), // 👈 Bắt buộc cho SSR
    provideZonelessChangeDetection(),
    provideRouter(routes),
    {
      provide: ROUTER_CONFIGURATION,
      useValue: {
        initialNavigation: 'enabledBlocking',
        canceledNavigationResolution: 'replace',
      },
    },

    // 👇 Không cần XMLHttpRequest, luôn dùng Fetch API
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    provideAnimationsAsync(),
    provideToastr(),
    providePrimeNG({
      theme: { preset: Aura },
    }),
    provideNgxSkeletonLoader({
      theme: {
        extendsFromRoot: true,
        height: '30px',
      },
    }),
    ConfirmationService,

    { provide: MAT_DATE_LOCALE, useValue: 'vi-VN' },
  ],
};
