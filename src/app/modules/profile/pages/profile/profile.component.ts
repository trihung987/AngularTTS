import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './../../../auth/services/auth.service';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Giả định UserDto được định nghĩa ở đây hoặc import từ file khác
interface UserDto {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [CommonModule, RouterModule, FormsModule]
})
export class ProfileComponent implements OnInit {
  sidebarItems = [
    {
      id: 'personal-info',
      label: 'Thông tin tài khoản',
      icon: 'user-detail',
      route: '/profile/me',
    },
    {
      id: 'my-tickets',
      label: 'Vé của tôi',
      icon: 'ticket',
      route: '/profile/my-tickets',
    },
  ];

  user$: Observable<UserDto | null>;

  constructor(private authService: AuthService) { this.user$ = this.authService.user$;}

  ngOnInit(): void {

  }


  getInitials(fullName: string | undefined | null): string {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map((name: string) => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
