// register.component.ts
import { Component, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  AbstractControlOptions,
  FormBuilder,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SignUpRequest } from '../../models/register.model';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-sign-up',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class RegisterComponent implements OnInit {
  signUpForm!: FormGroup;
  submitted = false;
  isLoading = signal(false);
  showPassword = false;
  showRetypedPassword = false;

  constructor(
    private fb: NonNullableFormBuilder,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    this.signUpForm = this.fb.group(
      {
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(5),
            Validators.maxLength(30),
          ],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$'),
          ],
        ],
        retypedPassword: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        fullname: [
          '',
          [
            Validators.required,
            Validators.minLength(5),
            Validators.maxLength(50),
          ],
        ],
      },
      {
        // This is the new, type-safe way to provide validators
        validators: this.passwordMatchValidator as (
          control: AbstractControl
        ) => ValidationErrors | null,
        updateOn: 'submit',
      } as AbstractControlOptions
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const retyped = form.get('retypedPassword')?.value;
    if (password !== retyped) {
      form.get('retypedPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Remove the error if matched
      if (form.get('retypedPassword')?.hasError('passwordMismatch')) {
        form.get('retypedPassword')?.setErrors(null);
        form
          .get('retypedPassword')
          ?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      }
      return null;
    }
  }

  togglePasswordVisibility(field: 'password' | 'retypedPassword') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showRetypedPassword = !this.showRetypedPassword;
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.signUpForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required'])
      return `${this.getFieldDisplayName(fieldName)} không được để trống`;
    if (errors['minlength'])
      return `${this.getFieldDisplayName(fieldName)} phải ít nhất ${
        errors['minlength'].requiredLength
      } ký tự`;
    if (errors['maxlength'])
      return `${this.getFieldDisplayName(fieldName)} không được vượt quá ${
        errors['maxlength'].requiredLength
      } ký tự`;
    if (errors['email']) return 'Vui lòng nhập địa chỉ email hợp lệ';
    if (errors['pattern'] && fieldName === 'password')
      return 'Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số';
    if (errors['passwordMismatch'] && fieldName === 'retypedPassword')
      return 'Mật khẩu không khớp';

    return 'Invalid input';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      username: 'Username',
      password: 'Mật khẩu',
      retypedPassword: 'Mật khẩu nhập lại',
      email: 'Email',
      fullname: 'Tên đầy đủ',
    };
    return displayNames[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.signUpForm.get(fieldName);
    return !!(field && field.errors && field.touched);
  }

  onSubmit() {
    this.submitted = true;

    if (this.signUpForm.invalid) {
      // Show specific errors for invalid fields
      Object.keys(this.signUpForm.controls).forEach((key) => {
        const control = this.signUpForm.get(key);
        console.log('Control:', key, 'is invalid:', control?.invalid);
        if (control && control.invalid) {
          console.warn("log invalid  ", key, control.errors)
          control.markAsTouched();
        }
      });
      this.toastr.error('Vui lòng sửa các thông tin bên dưới', 'Lỗi đăng ký');
      return;
    }

    this.isLoading.set(true);
    const signUpData: SignUpRequest = this.signUpForm.value;

    this.authService.signUp(signUpData).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toastr.success(
          'Đăng ký thành công',
          'Bạn có thể đăng nhập ngay bây giờ'
        );
        console.log('Sign up success', res);
        // Reset form after successful registration
        this.signUpForm.reset();
        this.submitted = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMessage =
          err.error?.message || 'Đăng ký thất bại. Vui lòng thử lại sau.';
        this.toastr.error(errorMessage, 'Lỗi đăng ký');
        console.error('Sign up error', err);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }
}
