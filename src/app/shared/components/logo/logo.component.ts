import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logo',
  imports: [],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.css',
})
export class AppLogoComponent {
  constructor(private router: Router) {}
  navigateHome() {
    this.router.navigate(['/']);
  }
}
