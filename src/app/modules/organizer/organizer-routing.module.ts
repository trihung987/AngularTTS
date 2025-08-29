import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateEventComponent } from './pages/create-event/create-event.component';
import { EventsListComponent } from './pages/events-list/events-list.component';

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
    path: '**',
    redirectTo: 'events',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizerRoutingModule {}
