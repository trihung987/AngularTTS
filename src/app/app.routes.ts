// src/app/app.routes.ts

import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { MainLayoutComponent } from './core/components/layout/main-layout/main-layout.component';
import { HomeComponent } from './modules/home/home.component';
import { AuthGuard } from './core/guard/auth.guard';
import { AuthRedirectGuard } from './core/guard/auth-redirect.guard';
import { OrganizeLayoutComponent } from './modules/organizer/components/organize-layout/organize-layout.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { EventListComponent } from './modules/events/pages/event-list/event-list.component';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [AuthRedirectGuard], // Guard này ngăn người dùng đã login vào /auth/*
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '', // Route cho layout chính
    component: MainLayoutComponent,
    children: [
      {
        path: '', // Trang chủ, không cần guard, ai cũng vào được
        component: HomeComponent,
      },
      {
        path: 'about',
        canActivate: [AuthGuard], // Trang about được bảo vệ, chỉ người đã login mới vào được
        loadChildren: () =>
          import('./modules/about/about.module').then((m) => m.AboutModule),
      },
      { path: 'notfound', component: NotFoundComponent },
    ],
  },
  {
    path: 'organizer',
    canActivate: [AuthGuard], // Bảo vệ cả module organizer
    component: OrganizeLayoutComponent,
    loadChildren: () =>
      import('./modules/organizer/organizer.module').then(
        (m) => m.OrganizerModule
      ),
  },
  {
    path: 'events',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: EventListComponent,
      },
    ],
  },
  { path: '**', redirectTo: 'notfound' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      //Bật option khi navigation route
      // //Nếu enableBlock thì sẽ k render <router-outlet> cho đến khi nhận được navigation cuối cùng, lý do thường có guard sẽ redirect đi
      // //giúp k bị flicker khi tình trạng trong khi bị redirect, UI load nhanh render ra trước khi chuyển URL,sẽ không dẫn đến
      // //  màn hình sẽ bị nháy giữa 2 UI khi vào 1 url và bị redirect ngay đi (GUARD)
      // // nếu enableNonBlocking thì vẫn navigate nhưng sẽ k chặn UI render, thích hợp khi muốn load nhanh UI trước, rồi router resolve sau.
      // //  (dễ bị flicker) vì có thể UI sẽ load nhanh ra trước
      initialNavigation: 'enabledBlocking',
      canceledNavigationResolution: 'replace',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
