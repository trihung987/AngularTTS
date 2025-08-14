// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../shared/services/http.service';
import { SignUpRequest } from '../models/register.model';
import { LoginRequest } from '../models/login.model';
import { tokenDto } from '../models/token-dto.model';

@Injectable({
  providedIn: 'root', // Làm service này có thể được sử dụng trong toàn bộ ứng dụng
})
export class AuthService {
  constructor(private http: HttpService) {}

  signUp(data: SignUpRequest): Observable<string> {
    return this.http.post('/auth/register', data);
  }

  login(data: LoginRequest): Observable<tokenDto> {
    return this.http.post('/auth/login', data);
  }

}
