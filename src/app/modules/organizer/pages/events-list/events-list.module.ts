// src/app/components/events-list/events-list.module.ts
// This is optional since we're using standalone components,
// but can be useful if you prefer module-based approach

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Material Modules
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

// Components
import { EventsListComponent } from './events-list.component';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { EventsPaginationComponent } from '../../components/events-pagination/events-pagination.component';


@NgModule({
  declarations: [
  ],
  imports: [
    // Angular Core
    CommonModule,
    FormsModule,
    RouterModule,

    // Material UI
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,

    EventsListComponent,
    EventCardComponent,
    EventsPaginationComponent,
  ],
  exports: [EventsListComponent, EventCardComponent, EventsPaginationComponent],
})
export class EventsListModule {}
