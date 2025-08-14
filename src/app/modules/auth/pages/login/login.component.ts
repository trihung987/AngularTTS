import { tokenDto } from './../../models/token-dto.model';
import { AuthService } from './../../services/auth.service';
import { LoginRequest } from './../../models/login.model';
import { Component, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControlOptions,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loginError: string | null = null;
  isLoading = signal(false);

  constructor(
    private fb: NonNullableFormBuilder,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required'])
      return `${this.getFieldDisplayName(fieldName)} không được để trống`;

    return 'Invalid input';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      username: 'Username',
      password: 'Mật khẩu',
      terms: 'Điều khoản sử dụng',
    };
    return displayNames[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.errors && field.touched);
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group(
      {
        username: ['', [Validators.required]],
        password: ['', [Validators.required]],
        terms: [false, [Validators.requiredTrue]],
      },
      {
        updateOn: 'submit',
      } as AbstractControlOptions
    );
  }

  onSubmit(): void {
    this.loginError = null;
    if (this.loginForm.invalid) {
      // Show specific errors for invalid fields
      this.loginForm.markAllAsTouched();
      this.toastr.error(`Vui lòng điền đầy đủ thông tin `, 'Không hợp lệ');
      return;
    } else {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        if (control && control.invalid) {
          control.markAsUntouched();
        }
      });
    }

    this.isLoading.set(true);
    const loginData: LoginRequest = this.loginForm.value;
    this.authService.login(loginData).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        this.toastr.success('Đăng nhập thành công', 'Chào mừng bạn quay trở lại');
        this.router.navigate(["/"]);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.loginError = err.error?.message || 'Login failed';
        this.toastr.error('Vui lòng thử lại sau', 'Lỗi đăng nhập');
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }
}
