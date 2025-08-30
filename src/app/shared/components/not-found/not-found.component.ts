import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule, MatCard } from '@angular/material/card';
import { MatCardContent } from "@angular/material/card";

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css'],
  imports: [MatIconModule],
})
export class NotFoundComponent {
  constructor(private router: Router, private location: Location) {}

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.location.back();
  }

  navigateToEvents(): void {
    this.router.navigate(['/events']);
  }

  navigateToMyEvents(): void {
    this.router.navigate(['/my-events']);
  }

  navigateToHelp(): void {
    this.router.navigate(['/help']);
  }

  navigateToContact(): void {
    this.router.navigate(['/contact']);
  }
}
