import { RouterModule, Routes } from '@angular/router';
import { App } from './app';
import { NgModule } from '@angular/core';
import { MainLayoutComponent } from './core/components/layout/main-layout/main-layout.component';
import { LoginComponent } from './modules/auth/pages/login/login.component';
import { AuthModule } from './modules/auth/auth.module';
import { HomeComponent } from './modules/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'about',
        loadChildren: () =>
          import('./modules/about/about.module').then((m) => m.AboutModule),
      },
    ],
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  { path: '**', redirectTo: '' },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
