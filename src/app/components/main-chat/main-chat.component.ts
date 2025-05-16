import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  NgForOf,
  NgIf,
  NgOptimizedImage
} from '@angular/common';

import { MarkdownModule } from 'ngx-markdown';
import { FormsModule } from '@angular/forms';
import { Mistral } from '@mistralai/mistralai';
import { API_KEY } from '../../../API_KEY';
import { LocalService } from '../../services/local-service.service';
import { MistralChatMessage } from '../../interfaces/mistral-chat-message';

@Component({
  selector: 'app-main-chat',
  imports: [
    FormsModule,
    NgForOf,
    MarkdownModule,
    NgIf,
    NgOptimizedImage
  ],
  templateUrl: './main-chat.component.html',
  styleUrls: ['./main-chat.component.scss']
})

export class MainChatComponent implements OnInit {
  private readonly apiKey = API_KEY.MISTRAL_API_KEY;
  private readonly client = new Mistral({ apiKey: this.apiKey });
  private readonly _localService = inject(LocalService);
  private readonly STORAGE_KEY = 'chatMessages';
  private readonly MODEL = 'mistral-large-latest';

  public messages: { text: string, isUser: boolean }[] = [];
  public userInput = '';
  public isLoading = false;

  ngOnInit() {
    this.loadMessages();
  }

  private loadMessages(): void {
    try {
      const savedMessages = this._localService.getData(this.STORAGE_KEY);
      this.messages = savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error('Ошибка при загрузке сообщений:', error);
      this.messages = [];
    }
  }

  public async sendMessage(): Promise<void> {
    const userMessage = this.userInput.trim();

    if (!userMessage) return;

    this.addUserMessage(userMessage);
    this.userInput = '';
    this.isLoading = true;

    try {
      const historyMessages: MistralChatMessage[] = [];

      const recentMessages: { text: string, isUser: boolean }[] = [...this.messages].slice();

      recentMessages.forEach(msg => {
        historyMessages.push({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        });
      })

      historyMessages.push({ role: 'user', content: userMessage });

      const chatResponse = await this.client.chat.complete({
        model: this.MODEL,
        messages: historyMessages
      });

      if (chatResponse && chatResponse.choices && chatResponse.choices.length > 0) {
        const textToString = chatResponse.choices[0].message.content!.toString();
        this.addAiMessage(textToString);
      }
    } catch (error) {
      console.error('Ошибка при получении ответа:', error);

      this.addAiMessage('Извините, произошла ошибка при обработке вашего запроса.');
    } finally {
      this.isLoading = false;
      this.saveMessagesToLocalStorage();
    }
  }

  private addUserMessage(message: string): void {
    this.messages.push({ text: message, isUser: true });
  }

  private addAiMessage(message: string): void {
    this.messages.push({ text: message, isUser: false });
  }

  public clearChat(): void {
    this.messages = [];
    this.saveMessagesToLocalStorage();
  }

  public saveMessagesToLocalStorage(): void {
    const messagesString = JSON.stringify(this.messages);
    this._localService.saveData(this.STORAGE_KEY, messagesString);
  }
}
