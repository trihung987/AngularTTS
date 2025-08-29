import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
  Input,
  signal,
  input,
} from '@angular/core'; // Added OnDestroy
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { UserDto } from '../../../modules/auth/models/user-dto.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.css'],
})
export class UserMenuComponent implements OnInit, OnDestroy {
  // Implemented OnDestroy
  isMenuOpen = false;
  isLogin = input<boolean>(true);
  user: UserDto | null = null;
  private userSubscription: Subscription | undefined;

  constructor(
    private el: ElementRef,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
  }

  ngOnInit(): void {
    this.userSubscription = this.authService.user$.subscribe((user) => {
      this.user = user;
      console.log('User data updated in user-menu:', this.user);
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isMenuOpen && !this.el.nativeElement.contains(event.target)) {
      this.isMenuOpen = false;
    }
  }

  openMenu(): void {
    if (!this.isTouchDevice()) {
      this.isMenuOpen = true;
    }
  }

  closeMenu(): void {
    if (!this.isTouchDevice()) {
      this.isMenuOpen = false;
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: (isLogout) => {
        if (isLogout) {
          this.toastr.success('Đăng xuất thành công', 'Thông báo');
          this.router.navigate(['/auth/login']);
        } else {
          this.toastr.error('Đăng xuất không thành công', 'Lỗi');
        }
      },
      error: () => {
        this.toastr.error('Đăng xuất không thành công', 'Lỗi');
      },
    });
  }

  navigateTo(path: string): void {
    this.isMenuOpen = false;
    this.router.navigate([path]);
  }

  hasUserAvatar(): boolean {
    return !!this.user?.avatarUrl;
  }

  getUserInitials(): string {
    if (!this.user?.fullName) return 'U';
    return this.user.fullName
      .split(' ')
      .map((name: string) => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}
