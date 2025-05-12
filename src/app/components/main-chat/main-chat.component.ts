import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import { MarkdownModule } from 'ngx-markdown';
import { FormsModule } from '@angular/forms';
import { NgForOf } from '@angular/common';
import { Mistral } from '@mistralai/mistralai';
import { API_KEY } from '../../../API_KEY';
import { LocalService } from '../../services/local-service.service';

@Component({
  selector: 'app-main-chat',
  imports: [
    FormsModule,
    NgForOf,
    MarkdownModule
  ],
  templateUrl: './main-chat.component.html',
  styleUrls: ['./main-chat.component.scss']
})

export class MainChatComponent implements OnInit {
  private apiKey = API_KEY.MISTRAL_API_KEY;
  private client = new Mistral({ apiKey: this.apiKey });
  private localService = inject(LocalService);

  public messages: { text: string, isUser: boolean }[] = [];
  public userInput = '';

  ngOnInit() {
    this.messages = JSON.parse(
      this.localService.getData('chatMessages') || '[]'
    );
  }

  public async sendMessage() {
    const userMessage = this.userInput;

    if (!this.userInput.trim()) return;

    this.addMessageInChat();

    this.userInput = '';

    try {
      const chatResponse = await this.client.chat.complete({
        model: 'mistral-large-latest',
        messages: [{role: 'user', content: userMessage}],
      });

      if ( chatResponse && chatResponse.choices && chatResponse.choices.length > 0 ) {
        const textToString = chatResponse.choices[0].message.content!.toString();

        this.messages.push({
          text: textToString,
          isUser: false
        });
      }
    } catch (error) {
      console.error('Error getting chat response:', error);

      this.messages.push({
        text: 'Sorry, there was an error processing your request.',
        isUser: false
      });
    }

    this.saveMessagesToLocalStorage();
  }

  public addMessageInChat() {
    this.messages.push({ text: this.userInput, isUser: true });
  }

  public clearChat() {
    this.messages = [];
    this.saveMessagesToLocalStorage();
  }

  public saveMessagesToLocalStorage() {
    const messagesString = JSON.stringify(this.messages);
    this.localService.saveData('chatMessages', messagesString);
  }
}
