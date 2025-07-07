import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./components/welcome-menu/welcome-menu.component').then(
        (m) => m.WelcomeMenuComponent
      )
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/register-login/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register-login/register/register.component').then(
        (m) => m.RegisterComponent
      )
  },
  {
    path: 'main-chat',
    loadComponent: () =>
      import('./components/main-chat/main-chat.component').then(
        (m) => m.MainChatComponent
      )
  },
  { path: '**', redirectTo: 'welcome' }
];
