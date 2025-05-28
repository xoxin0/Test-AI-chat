import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
  AfterViewChecked, AfterViewInit
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
import { LocalStorageService } from '../../services/local-storage.service';
import { ClipboardService } from '../../services/clipboard.service';
import { MistralChatMessage } from '../../interfaces/mistral-chat-message';
import { Message } from '../../interfaces/message';
import { ChatCompletionResponse } from '@mistralai/mistralai/models/components';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { Chat } from '../../interfaces/chat';
import { FocusInputService } from '../../services/focus-input.service';

@Component({
  selector: 'app-main-chat',
  imports: [
    FormsModule,
    NgForOf,
    MarkdownModule,
    NgIf,
    NgOptimizedImage,
    SideBarComponent
  ],
  templateUrl: './main-chat.component.html',
  styleUrls: ['./main-chat.component.scss']
})

export class MainChatComponent implements OnInit, AfterViewChecked {
  private readonly API_KEY: string = API_KEY.MISTRAL_API_KEY;
  private readonly CLIENT: Mistral = new Mistral({ apiKey: this.API_KEY });
  private readonly _localService: LocalStorageService = inject(LocalStorageService);
  private readonly _clipboardService: ClipboardService = inject(ClipboardService);
  private readonly _focusInputService: FocusInputService = inject(FocusInputService);
  private readonly MODEL: string = 'mistral-large-latest';
  private readonly INITIAL_MESSAGE: string = 'Привет! Меня зовут TestAI. Чем я могу вам помочь сегодня?';

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  public chats: Chat[] = [];
  public activeChat: string = '';
  public userInput: string = '';
  public isLoading: boolean = false;
  public sidebarIsOpen: boolean = true;

  get messages(): Message[] {
    const chat = this.chats.find(c => c.id === this.activeChat);
    return chat ? chat.messages : [];
  }

  ngOnInit(): void {
    this.loadChats();
    this._focusInputService.focusInput();
  }

  ngAfterViewChecked(): void {
    this.addCopyButtonsToCodeBlocks();
  }

  private loadChats(): void {
    const savedChats = this._localService.getData('chats');
    if (savedChats) {
      this.chats = JSON.parse(savedChats);

      const activeChat = this._localService.getData('activeChat');
      if (activeChat && this.chats.some(c => c.id === activeChat)) {
        this.activeChat = activeChat;
      } else {
        this.activeChat = this.chats[0]?.id || '';
      }
    }

    if (this.chats.length === 0) {
      this.addNewChat();
    }

    setTimeout(() => this.scrollToBottom(), 0);
  }

  public addNewChat(): void {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Новый чат`,
      messages: [{ text: this.INITIAL_MESSAGE, isUser: false }]
    };

    this.chats.push(newChat);
    this.activeChat = newChat.id;
    this.saveChats();
    this._focusInputService.focusInput();
  }

  public onSelectChat(chatId: string): void {
    this.activeChat = chatId;
    this._localService.saveData('activeChat', chatId);
    this.scrollToBottom();
    this._focusInputService.focusInput();
  }

  public onRemoveChat(chatId: string): void {
    const indexChat = this.chats.findIndex(c => c.id === chatId);
    if (indexChat === -1) return;

    this.chats.splice(indexChat, 1);

    if (chatId === this.activeChat) {
      this.activeChat = this.chats[0]?.id || '';

      if (this.chats.length === 0) {
        this.addNewChat();
        return;
      }
    }

    this.saveChats();
  }

  public onCloseSidebar(isOpen: boolean): void {
    this.sidebarIsOpen = isOpen;
  }

  public clearChat(): void {
    const chat = this.chats.find(c => c.id === this.activeChat);
    if (chat) {
      chat.messages = [{ text: this.INITIAL_MESSAGE, isUser: false }];
      this.saveChats();
    }
  }

  private saveChats(): void {
    this._localService.saveData('chats', JSON.stringify(this.chats));
    this._localService.saveData('activeChat', this.activeChat);
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

  public async sendMessage(): Promise<void> {
    const userMessage: string = this.userInput.trim();
    if (!userMessage) return;

    const chat = this.chats.find(c => c.id === this.activeChat);
    if (!chat) return;

    chat.messages.push({ text: userMessage, isUser: true });
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();
    this.saveChats();

    try {
      const historyMessages: MistralChatMessage[] = [];

      historyMessages.push({
        role: 'system',
        content: 'Ты - TestAI, дружелюбный и полезный ассистент. Всегда представляйся как TestAI, если тебя спросят, как тебя зовут.'
      });

      chat.messages.forEach(msg => {
        historyMessages.push({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        });
      });

      const chatResponse: ChatCompletionResponse = await this.CLIENT.chat.complete({
        model: this.MODEL,
        messages: historyMessages
      });

      if (chatResponse && chatResponse.choices && chatResponse.choices.length > 0) {
        const aiResponse: string = chatResponse.choices[0].message.content!.toString();
        chat.messages.push({ text: aiResponse, isUser: false });

        // заголовок чата
        if (chat.messages.filter(m => m.isUser).length === 1) {
          chat.title = userMessage.length > 30 ? userMessage.substring(0, 30) + '...' : userMessage;
        }
      }
    } catch (error) {
      console.error('Ошибка при получении ответа:', error);
      chat.messages.push({ text: 'Извините, произошла ошибка при обработке вашего запроса.', isUser: false });
    } finally {
      this.isLoading = false;
      this.saveChats();
      this.scrollToBottom();
    }
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
