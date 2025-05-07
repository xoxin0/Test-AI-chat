import { Component } from '@angular/core';
import { MainChatComponent } from './components/main-chat/main-chat.component';

@Component({
  selector: 'app-root',
  imports: [ MainChatComponent ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent {
  title = 'TestAI-chat';
}
