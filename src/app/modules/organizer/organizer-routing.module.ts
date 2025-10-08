import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateEventComponent } from './pages/create-event/create-event.component';
import { EventsListComponent } from './pages/events-list/events-list.component';
import { RevenueAnalyticsComponent } from './pages/revenue-analytics/revenue-analytics.component';
import { EventDetailComponent } from './pages/event-detail/event-detail.component';

const routes: Routes = [
  {
    path: 'create-event',
    component: CreateEventComponent,
  },
  {
    path: 'edit-event/:id',
    component: CreateEventComponent,
  },
  {
    path: 'events',
    component: EventsListComponent,
  },
  {
    path: 'events/:id',
    component: EventDetailComponent,
  },
  {
    path: 'revenue',
    component: RevenueAnalyticsComponent,
  },

  {
    path: '**',
    redirectTo: 'events',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizerRoutingModule {}
