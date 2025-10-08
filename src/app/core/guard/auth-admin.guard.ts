import { RoleDto } from './../../modules/auth/models/user-dto.model';
import { ToastrService } from 'ngx-toastr';
// auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanMatch,
  GuardResult,
  MaybeAsync,
  Route,
  Router,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { Observable } from 'rxjs';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthAdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (isPlatformServer(this.platformId)) {
      return true;
    }
    // Client-side check
    if (isPlatformBrowser(this.platformId)) {
      if (this.authService.isLogin()) {
        const isAdmin = this.authService.getUser()?.roles.some(role => role.name === 'ADMIN');
        if (isAdmin) {
          console.log('Đã login từ guard admin');
          return true;
        }
      }
      // // Hiển thị thông báo (chỉ client mới có DOM để toastr)
      // this.toastr.error(
      //   'Vui lòng đăng nhập để truy cập trang này.',
      //   'Từ chối truy cập'
      // );

      // this.authService.logout();

      // // Điều hướng về login
      return this.router
        .navigate(['/'], { replaceUrl: true })
        .then(() => false);
    }

    return false;
  }
}
