import { AuthService } from './../../../auth/services/auth.service';
// profile-me.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Skeleton } from 'primeng/skeleton';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Assuming you have these imports from your project
// import { AuthService } from '../path-to-your-auth-service';
// import { UserDto } from '../path-to-your-interfaces';

interface UserDto {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-profile-me',
  templateUrl: './me.component.html',
  styleUrls: ['./me.component.css'],
  imports: [FormsModule, CommonModule],
})
export class ProfileMeComponent implements OnInit, OnDestroy {
  user: UserDto | null = null;
  private userSubscription: Subscription | undefined;
  isEditing = false;

  editForm = {
    fullName: '',
    email: '',
    username: '',
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.user$.subscribe((user) => {
      this.user = user;
      if (user) {
        this.editForm = {
          fullName: user.fullName,
          email: user.email,
          username: user.username,
        };
      }
      console.log('User data from me:', this.user);
    });

    // this.user = {
    //   id: '1',
    //   fullName: 'Nguyễn Văn An',
    //   email: 'nguyen.van.an@example.com',
    //   username: 'nguyenvanan',
    //   avatarUrl: 'https://via.placeholder.com/150',
    // };

    // this.editForm = {
    //   fullName: this.user.fullName,
    //   email: this.user.email,
    //   username: this.user.username,
    // };
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  onEditToggle(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.user) {
      // Reset form if cancelling edit
      this.editForm = {
        fullName: this.user.fullName,
        email: this.user.email,
        username: this.user.username,
      };
    }
  }

  onSaveChanges(): void {
    // Here you would typically call an API to update user info
    console.log('Saving changes:', this.editForm);

    // Mock update
    if (this.user) {
      this.user = {
        ...this.user,
        fullName: this.editForm.fullName,
        email: this.editForm.email,
        username: this.editForm.username,
      };
    }

    this.isEditing = false;

    // Show success message or handle API response
  }

  onAvatarChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Here you would typically upload the file to your server
      console.log('Avatar file selected:', file);

      // For demo, create a preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.user) {
          this.user.avatarUrl = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
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
