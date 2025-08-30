import { ToastrService } from 'ngx-toastr';
// header.component.ts
import {
  CommonModule,
  isPlatformServer,
  NgOptimizedImage,
} from '@angular/common';
import { UserDto } from '../../../modules/auth/models/user-dto.model';
import { AuthService } from './../../../modules/auth/services/auth.service';
import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AppLogoComponent } from '../../../shared/components/logo/logo.component';
import { UserMenuComponent } from '../../../shared/components/user-menu/user-menu.component';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { Observable, finalize, of } from 'rxjs'; // Import Observable

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    AppLogoComponent,
    UserMenuComponent,
    NgxSkeletonLoaderComponent,
    RouterModule,
  ], // Add RouterModule here
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  standalone: true,
})
export class HeaderComponent implements OnInit {
  isMenuOpen = false;
  isLoading = signal(true);

  isLogin = signal(false);
  user$: Observable<UserDto | null>;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize observables from the service
    this.user$ = this.authService.user$;
  }

  async ngOnInit() {
    this.isLoading.set(true);
    if (this.authService.isLogin()) {
      try {
        this.isLogin.set(true);
        this.authService
          .reloadUser()
          .catch((error) => {
            console.error('Failed to reload user on init:', error);
          })
          .finally(() => {
            this.isLoading.set(false);
          });
      } catch (error) {
        console.error('Failed to reload user on init:', error);
      }
    } else {
      this.isLoading.set(false);
    }
    if (isPlatformServer(this.platformId)) {
      this.isLoading.set(true);
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  redirect(path: string) {
    this.isMenuOpen = false; // Close mobile menu on navigation
    this.router.navigate([path]);
  }
}
