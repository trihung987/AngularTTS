// src/app/core/guard/auth-redirect.guard.ts

import { Injectable } from '@angular/core';
// Import CanActivate instead of CanActivateChild
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { Observable } from 'rxjs';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthRedirectGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree //
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    if (isPlatformServer(this.platformId)) {
      console.log('URL server' + this.router.url);

    }

    if (isPlatformBrowser(this.platformId)) {
      console.log('URL client' + this.router.url);
    }
    console.log('URL guard' + this.router.url);
    if (this.authService.isLogin()) {
      return this.router.createUrlTree(['/']);
    }
    console.log('URL guard' + this.router.url);
    return true;
  }
}
