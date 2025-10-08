import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './pages/profile/profile.component';
import { ProfileMeComponent } from './pages/me/me.component';
import { MyTicketsComponent } from './pages/my-tickets/my-tickets.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'me',
    pathMatch: 'full',
  },
  {
    path: 'me',
    component: ProfileMeComponent,
  },
  {
    path: 'my-tickets',
    component: MyTicketsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }
