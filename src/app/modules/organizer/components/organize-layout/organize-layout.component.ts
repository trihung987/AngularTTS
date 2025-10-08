// event-layout.component.ts
import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformServer } from '@angular/common';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  query,
  stagger,
} from '@angular/animations';
import { FooterComponent } from '../../../../core/components/footer/footer.component';
import { AppLogoComponent } from '../../../../shared/components/logo/logo.component';
import { UserMenuComponent } from '../../../../shared/components/user-menu/user-menu.component';
import { AuthService } from '../../../auth/services/auth.service';
import { Observable } from 'rxjs';
import { UserDto } from '../../../auth/models/user-dto.model';
import { NgxSkeletonLoaderComponent } from "ngx-skeleton-loader";

@Component({
  selector: 'app-event-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    FooterComponent,
    AppLogoComponent,
    UserMenuComponent,
    NgxSkeletonLoaderComponent
],
  templateUrl: './organize-layout.component.html',
  styleUrls: ['./organize-layout.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate(
          '300ms ease-in',
          style({ transform: 'translateY(0%)', opacity: 1 })
        ),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '400ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('navItemStagger', [
      transition(':enter', [
        query(
          '.nav-item',
          [
            style({ opacity: 0, transform: 'translateY(-20px)' }),
            stagger(100, [
              animate(
                '300ms ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class OrganizeLayoutComponent implements OnInit {
  isProfileMenuOpen = false;
  currentUser = {
    name: 'Nguyễn Văn A',
    email: 'admin@example.com',
    avatar:
      'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=007bff&color=fff',
  };

  navItems = [
    {
      label: 'Tạo sự kiện',
      route: '/organizer/create-event',
      icon: 'plus-circle',
      active: false,
    },
    {
      label: 'Sự kiện của tôi',
      route: '/organizer/events',
      icon: 'calendar',
      active: false,
    },
    {
      label: 'Thống kê',
      route: '/organizer/revenue',
      icon: 'bar-chart',
      active: false,
    },
  ];

  isLoading = signal(true);

  // Use observables directly from the service
  isLoggedIn$: Observable<boolean>;
  isLogin = signal(false);
  user$: Observable<UserDto | null>;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.user$ = this.authService.user$;
    this.router.events.subscribe((event)=>{
      if (event instanceof NavigationEnd) {
        this.updateActiveNavItem(event.urlAfterRedirects);
      }
    })
  }

  async ngOnInit() {
    this.updateActiveNavItem();
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

  updateActiveNavItem(route: string = '') {
    if (route === '') route = this.router.url;
    this.navItems.forEach((item) => {
      item.active = route.startsWith(item.route);
    });
  }
}
