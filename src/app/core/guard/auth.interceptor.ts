// auth.interceptor.ts
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
} from '@angular/common/http';
import {
  Observable,
  throwError,
  switchMap,
  catchError,
  filter,
  take,
} from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../../modules/auth/services/auth.service';
import { StorageWrapperService } from './../../shared/services/storage-wrapper.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const storage = inject(StorageWrapperService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const accessToken = storage.getItem('accessToken');

  // Attach token if available
  const authReq = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: any) => {
      if (error.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null); // reset

          console.warn('Token expired, refreshing...');

          return authService.refreshToken().pipe(
            switchMap((newToken) => {
              isRefreshing = false;
              authService.setAccessToken(newToken);
              refreshTokenSubject.next(newToken); // thông báo token mới cho các request đang chờ

              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retryReq);
            }),
            catchError((err) => {
              isRefreshing = false;
              refreshTokenSubject.next(null);
              authService.clearDataAuth();
              toastr.error(
                'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                'Lỗi xác thực'
              );
              router.navigate(['/auth/login']);
              return throwError(() => err);
            })
          );
        } else {
          // Nếu đang refresh thì chờ token mới rồi retry
          return refreshTokenSubject.pipe(
            filter((token) => token != null),
            take(1),
            switchMap((token) => {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` },
              });
              return next(retryReq);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};
