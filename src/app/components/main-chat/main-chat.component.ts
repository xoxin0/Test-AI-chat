import {
  Component,
  ElementRef,
  inject,
  OnChanges,
  OnInit,
  ViewChild,
  AfterViewChecked
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
import { ClipboardService } from '../../services/clipboard.service';
import { MistralChatMessage } from '../../interfaces/mistral-chat-message';
import { Message } from '../../interfaces/message';
import { FocusInputService } from '../../services/focus-input.service';
import { ChatCompletionResponse } from '@mistralai/mistralai/models/components';

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

export class MainChatComponent implements OnInit, OnChanges, AfterViewChecked {
  private readonly API_KEY: string = API_KEY.MISTRAL_API_KEY;
  private readonly CLIENT: Mistral = new Mistral({ apiKey: this.API_KEY });
  private readonly _localService: LocalService = inject(LocalService);
  private readonly _clipboardService: ClipboardService = inject(ClipboardService);
  private readonly _focusInputService: FocusInputService = inject(FocusInputService);
  private readonly STORAGE_KEY: string = 'chatMessages';
  private readonly MODEL: string = 'mistral-large-latest';
  private readonly INITIAL_MESSAGE: string = 'Привет! Меня зовут TestAI. Чем я могу вам помочь сегодня?';

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  public messages: Message[] = [];
  public userInput: string = '';
  public isLoading: boolean = false;

  ngOnInit(): void {
    this.loadMessages();
  }

  ngOnChanges(): void {
    this._focusInputService.focusInput();
  }

  ngAfterViewChecked(): void {
    this.addCopyButtonsToCodeBlocks();
  }

  private loadMessages(): void {
    try {
      const savedMessages: string | null = this._localService.getData(this.STORAGE_KEY);
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

  private addCopyButtonsToCodeBlocks(): void {
    const codeBlocks: NodeListOf<Element> = document.querySelectorAll('pre:not(.copy-button-added)');

    codeBlocks.forEach(codeBlock => {
      // обертка для позиционирования хэдера с кодом
      const wrapper: HTMLDivElement = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
      wrapper.appendChild(codeBlock);

      const headerContainer: HTMLDivElement = document.createElement('div');
      headerContainer.className = 'code-header';

      let language = 'code';
      const codeElement: HTMLElement | null = codeBlock.querySelector('code');
      if (codeElement) {
        const classes: string[] = [...codeElement.classList];
        const languageClass: string | undefined = classes.find(cls => cls.startsWith('language-'));

        if (languageClass) {
          language = languageClass.replace('language-', '');
        }
      }

      const languageLabel: HTMLSpanElement = document.createElement('span');
      languageLabel.className = 'language-label';
      languageLabel.innerText = language;

      const copyButton: HTMLButtonElement = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.innerText = 'Copy';
      copyButton.addEventListener('click', () => this.copyCodeContent(codeBlock, copyButton));

      headerContainer.appendChild(languageLabel);
      headerContainer.appendChild(copyButton);

      wrapper.insertBefore(headerContainer, codeBlock);

      codeBlock.classList.add('copy-button-added');
    });
  }

  private copyCodeContent(codeBlock: Element, button: HTMLButtonElement): void {
    if (button.innerText !== 'Copy') {
      return;
    }

    const code: string = codeBlock.textContent || '';

    this._clipboardService.copyToClipboard(code)
      .then(() => {
        const originalText: string = button.innerText;
        button.innerText = 'Copied ✓';

        setTimeout(() => {
          button.innerText = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Ошибка при копировании текста:', err);
        button.innerText = 'Ошибка';

        setTimeout(() => {
          button.innerText = 'Copy';
        }, 2000);
      });
  }

  private addInitialMessage(): void {
    this.messages.push({ text: this.INITIAL_MESSAGE, isUser: false });
    this.saveMessagesToLocalStorage();
  }

  // отправка запроса к API, принятие ответа
  public async sendMessage(): Promise<void> {
    const userMessage: string = this.userInput.trim();

    if (!userMessage) return;

    // добавление сообщения юзера в массив messages
    this.addUserMessage(userMessage);
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();

    try {
      const historyMessages: MistralChatMessage[] = [];

      historyMessages.push({
        role: 'system',
        content: 'Ты - TestAI, дружелюбный и полезный ассистент. Всегда представляйся как TestAI, если тебя спросят, как тебя зовут.'
      });

      const recentMessages: Message[] = this.messages.slice();

      recentMessages.forEach(msg => {
        historyMessages.push({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        });
      });

      historyMessages.push({ role: 'user', content: userMessage });

      // отправка запроса к API
      const chatResponse: ChatCompletionResponse = await this.CLIENT.chat.complete({
        model: this.MODEL,
        messages: historyMessages
      });

      if (chatResponse && chatResponse.choices && chatResponse.choices.length > 0) {
        const textToString: string = chatResponse.choices[0].message.content!.toString();
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
          const container: HTMLElement = this.messagesContainer.nativeElement;
          container.scrollTop = container.scrollHeight;
        }
      }, 0);
    } catch (err) {
      console.error('Ошибка при прокрутке сообщений:', err);
    }
  }
}
