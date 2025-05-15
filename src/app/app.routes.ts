import { Routes } from '@angular/router';
import { WelcomeMenuComponent } from './components/welcome-menu/welcome-menu.component';
import { MainChatComponent } from './components/main-chat/main-chat.component';

export const routes: Routes = [
  { path: '', component: WelcomeMenuComponent, title: 'Welcome to TestAI chat' },
  { path: 'main-chat', component: MainChatComponent, title: 'Main chat'}
];
