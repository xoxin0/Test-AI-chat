import {
  Component,
  ElementRef,
  inject,
  OnChanges,
  OnInit,
  ViewChild
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
import { LocalService } from '../../services/local-storage.service';
import { MistralChatMessage } from '../../interfaces/mistral-chat-message';
import { Message } from '../../interfaces/message';

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

export class MainChatComponent implements OnInit, OnChanges {
  private readonly apiKey = API_KEY.MISTRAL_API_KEY;
  private readonly client = new Mistral({ apiKey: this.apiKey });
  private readonly _localService = inject(LocalService);
  private readonly STORAGE_KEY = 'chatMessages';
  private readonly MODEL = 'mistral-large-latest';
  private readonly INITIAL_MESSAGE = 'Привет! Меня зовут TestAI. Чем я могу вам помочь сегодня?';

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  public messages: Message[] = [];
  public userInput: string = '';
  public isLoading: boolean = false;

  ngOnInit() {
    this.loadMessages();
  }

  ngOnChanges() {
    this.focusInput();
  }

  private focusInput(): void {
    document.querySelector("input")!.focus();
  }

  // добавление сообщений из localStorage в массив всех сообщений
  private loadMessages(): void {
    try {
      const savedMessages = this._localService.getData(this.STORAGE_KEY);
      this.messages = savedMessages ? JSON.parse(savedMessages) : [];

      if (this.messages.length === 0) {
        this.addInitialMessage();
      }

      setTimeout(() => this.scrollToBottom(), 0);
    } catch (error) {
      console.error('Ошибка при загрузке сообщений:', error);
      this.messages = [];
      this.addInitialMessage();
    }
  }

  // добавление начального сообщения
  private addInitialMessage(): void {
    this.messages.push({ text: this.INITIAL_MESSAGE, isUser: false });
    this.saveMessagesToLocalStorage();
  }

  // отправка запроса к API, принятие ответа
  public async sendMessage(): Promise<void> {
    const userMessage = this.userInput.trim();

    if (!userMessage) return;

    // добавление сообщения юзера в массив messages
    this.addUserMessage(userMessage);
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();

    try {
      const historyMessages: MistralChatMessage[] = [];

      // начальные настройки для ии
      historyMessages.push({
        role: 'system',
        content: 'Ты - TestAI, дружелюбный и полезный ассистент. Всегда представляйся как TestAI, если тебя спросят, как тебя зовут.'
      });

      const recentMessages: Message[] = this.messages.slice();

      // проходит по всем сообщениям и преобразует их в формат для API Mistral
      recentMessages.forEach(msg => {
        historyMessages.push({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        });
      });

      historyMessages.push({ role: 'user', content: userMessage });

      // отправка запроса к API
      const chatResponse = await this.client.chat.complete({
        model: this.MODEL,
        messages: historyMessages
      });

      // добавление ответа в массив messages
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
      this.scrollToBottom();
    }
  }

  private addUserMessage(message: string): void {
    this.messages.push({ text: message, isUser: true });
    this.scrollToBottom();
  }

  private addAiMessage(message: string): void {
    this.messages.push({ text: message, isUser: false });
    this.scrollToBottom();
  }

  public clearChat(): void {
    this.messages = [];
    this.addInitialMessage();
    this.saveMessagesToLocalStorage();
  }

  public saveMessagesToLocalStorage(): void {
    this._localService.saveData(this.STORAGE_KEY, JSON.stringify(this.messages));
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.messagesContainer) {
          const container = this.messagesContainer.nativeElement;
          container.scrollTop = container.scrollHeight;
        }
      }, 0);
    } catch (err) {
      console.error('Ошибка при прокрутке сообщений:', err);
    }
  }
}
