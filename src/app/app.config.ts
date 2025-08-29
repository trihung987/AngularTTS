import { APP_INITIALIZER, ApplicationConfig, inject, PLATFORM_ID, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import {
  provideRouter,
  withDebugTracing,
  InitialNavigation,
  withRouterConfig,
  ROUTER_CONFIGURATION,
} from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/guard/auth.interceptor';
import { provideServerRendering } from '@angular/ssr';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideNgxSkeletonLoader } from 'ngx-skeleton-loader';
import { AuthService } from './modules/auth/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideToastr(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    {
      provide: ROUTER_CONFIGURATION,
      useValue: {
        initialNavigation: 'enabledBlocking',
        canceledNavigationResolution: 'replace',
      },
    },

    {
      provide: 'HTTP_CLIENT',
      useFactory: () => {
        const platformId = inject(PLATFORM_ID);
        if (isPlatformBrowser(platformId)) {
          // Browser mới dùng fetch
          return provideHttpClient(
            withFetch(),
            withInterceptors([authInterceptor])
          );
        }
        // Server dùng default (XHR backend của Angular Universal)
        return provideHttpClient(withInterceptors([authInterceptor]));
      },
    },
    provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura
            }
        }),
    provideNgxSkeletonLoader({
      theme: {
        extendsFromRoot: true,
        height: '30px',
      },
    }),

    { provide: MAT_DATE_LOCALE, useValue: 'vi-VN' },
  ],
};
