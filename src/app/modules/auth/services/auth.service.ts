import { RefreshTokenRequest } from './../models/refresh.model';
// src/app/services/auth.service.ts
import { Injectable, Injector } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  firstValueFrom,
  map,
  Observable,
  of,
} from 'rxjs';
import { HttpService } from '../../../shared/services/http.service';
import { SignUpRequest } from '../models/register.model';
import { LoginRequest } from '../models/login.model';
import { tokenDto } from '../models/token-dto.model';
import { UserDto } from '../models/user-dto.model';
import { StorageWrapperService } from '../../../shared/services/storage-wrapper.service';
import { response } from 'express';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root', // Làm service này có thể được sử dụng trong toàn bộ ứng dụng
})
export class AuthService {
  private userStore = new BehaviorSubject<UserDto | null>(null);
  user$ = this.userStore.asObservable(); // chỉ lắng nghe đọc không cho thay đổi

  isLoggedIn$: Observable<boolean> = this.user$.pipe(map((user) => !!user));
  constructor(
    private http: HttpService,
    private storage: StorageWrapperService,
    private router : Router
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    try {
      const userJson = this.storage.getItem('user');
      if (userJson) {
        const user: UserDto = JSON.parse(userJson);
        this.userStore.next(user);
      }
    } catch (error) {
      console.error('Could not load user from storage', error);
      this.clearDataAuth();
    }
  }

  signUp(data: SignUpRequest): Observable<string> {
    return this.http.post('/auth/register', data);
  }

  login(data: LoginRequest): Observable<tokenDto> {
    return this.http.post('/auth/login', data);
  }

  async reloadUser(): Promise<void> {
    try {
      const user = await firstValueFrom(this.me());
      this.storage.setItem('user', JSON.stringify(user));
      this.userStore.next(user);
    } catch (err) {
      console.error('Error reloading user:', err);
      this.userStore.next(null);
      this.storage.removeItem('user');
    }
  }

  getUser(): UserDto | null {
    return this.userStore.getValue();
  }

  refreshToken(): Observable<string> {
    return this.http.post(
      '/auth/refresh',
      {
        refreshToken: this.getRefreshToken(),
      },
      'text',
      true
    );
  }

  setAccessToken(token: string): void {
    //localStorage.setItem('accessToken', token);
    this.storage.setItem('accessToken', token);
  }

  setRefreshToken(token: string): void {
    //localStorage.setItem('accessToken', token);
    this.storage.setItem('refreshToken', token);
  }

  me(): Observable<UserDto> {
    return this.http.get('/auth/me', {});
  }

  isLoginFromServer(): Observable<boolean> {
    return this.me().pipe(
      map(() => true),
      catchError((error) => of(false))
    );
  }

  isLogin(): boolean {
    const accessToken = this.storage.getItem('accessToken');
    return !!accessToken;
  }

  clearDataAuth() {
    this.storage.removeItem('accessToken');
    this.storage.removeItem('refreshToken');
    this.storage.removeItem('user');
    this.userStore.next(null);
  }

  logout(): Observable<boolean> {
    const refreshToken = this.storage.getItem('refreshToken');
    console.log('delete refresh token', refreshToken);

    return this.http
      .post('/auth/logout', refreshToken ? refreshToken : '', 'text')
      .pipe(
        map(() => {
          this.clearDataAuth();
          console.info('delete complete');
          return true; //emit true on successful logout dont need of() because in map() sẽ auto được bọc observable(value) (value ở đây là kết quả được trả về )
          // nếu vẫn bọc of() thì sẽ trả về type kiểu Observable<boolean | Observable<boolean> > 1 obser được bọc trong 1 obser khác
        }),
        catchError((err) => {
          console.error('Logout error:', err);
          return of(false);
        })
      ); // gọi pip như vầy để setup và trả về cho bên khác 1 obser gọi tới để gọi dc hàm subscribe(), nếu hàm subscribe() dc gọi thì sẽ tự động khởi code trong này bởi observable là lazy sẽ k chạy khi k dc subscribe
  }

  getAccessToken(): string | null {
    return this.storage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return this.storage.getItem('refreshToken');
  }
}
