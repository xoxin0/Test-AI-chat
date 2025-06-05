import { Routes } from '@angular/router';
import { WelcomeMenuComponent } from './components/welcome-menu/welcome-menu.component';
import { MainChatComponent } from './components/main-chat/main-chat.component';
import { LoginComponent } from './components/register-login/login/login.component';
import { RegisterComponent } from './components/register-login/register/register.component';

export const routes: Routes = [
  { path: '', component: WelcomeMenuComponent, title: 'Welcome to TestAI chat' },
  { path: 'login', component: LoginComponent, title: 'Login' },
  { path: 'register', component: RegisterComponent, title: 'Register' },
  { path: 'main-chat', component: MainChatComponent, title: 'Main chat'},
  { path: '**', redirectTo: 'login' }
];
