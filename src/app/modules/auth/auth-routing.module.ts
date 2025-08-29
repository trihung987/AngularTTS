// src/app/modules/auth/auth-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthLayoutComponent } from './components/auth-layout/auth-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login', // URL đầy đủ sẽ là /auth/login
        component: LoginComponent,
      },
      {
        path: 'register', // URL đầy đủ sẽ là /auth/register
        component: RegisterComponent,
      },
      {
        // nếu vào mỗi auth thì redirect đến login
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)], // Sử dụng forChild cho module con
  exports: [RouterModule],
})
export class AuthRoutingModule {}
