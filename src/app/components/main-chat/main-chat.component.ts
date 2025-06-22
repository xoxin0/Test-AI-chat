import {
  Component,
  ElementRef,
  inject,
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
import { LocalStorageService } from '../../services/local-storage.service';
import { ClipboardService } from '../../services/clipboard.service';
import { MistralApiService } from '../../services/mistral-api.service';
import { Message } from '../../interfaces/message';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { Chat } from '../../interfaces/chat';
import { FocusInputService } from '../../services/focus-input.service';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import hljs from 'highlight.js';

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
  public chats: Chat[] = [];
  public activeChat: string = '';
  public userInput: string = '';
  public isLoading: boolean = false;
  public sidebarIsOpen: boolean = true;
  public currentUser: User | null = null;

  private readonly _localService: LocalStorageService = inject(LocalStorageService);
  private readonly _clipboardService: ClipboardService = inject(ClipboardService);
  private readonly _focusInputService: FocusInputService = inject(FocusInputService);
  private readonly _mistralApiService: MistralApiService = inject(MistralApiService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly INITIAL_MESSAGE: string = 'Привет! Меня зовут TestAI. Чем я могу вам помочь сегодня?';

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  get messages(): Message[] {
    const chat = this.chats.find(c => c.id === this.activeChat);
    return chat ? chat.messages : [];
  }

  public ngOnInit(): void {
    this.loadCurrentUser();
    this.loadChats();
    this._focusInputService.focusInput();
  }

  public ngAfterViewChecked(): void {
    this.highlightCodeBlocks();
    this.addCopyButtonsToCodeBlocks();
  }

  private highlightCodeBlocks(): void {
    const codeBlocks: NodeListOf<HTMLElement> = document.querySelectorAll('pre code:not(.hljs)');

    codeBlocks.forEach((block: HTMLElement) => {
      try {
        hljs.highlightElement(block);
      } catch (error) {
        console.debug('Ошибка при подсветке кода:', error);
      }
    });

    const inlineCodeBlocks: NodeListOf<HTMLElement> = document.querySelectorAll('code:not(pre code):not(.hljs)');

    inlineCodeBlocks.forEach((block: HTMLElement) => {
      try {
        if (block.textContent && block.textContent.length > 2) {
          hljs.highlightElement(block);
        }
      } catch (error) {
        console.debug('Ошибка при подсветке инлайн кода:', error);
      }
    });
  }

  private loadCurrentUser(): void {
    const savedUser = this._localService.getData('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  private loadChats(): void {
    if (this.currentUser && this.currentUser.chats) {
      this.chats = this.currentUser.chats;
    } else {
      const savedChats = this._localService.getData('chats');
      if (savedChats) {
        this.chats = JSON.parse(savedChats);
      }
    }

    const activeChat = this._localService.getData('activeChat');
    if (activeChat && this.chats.some(c => c.id === activeChat)) {
      this.activeChat = activeChat;
    } else {
      this.activeChat = this.chats[0]?.id || '';
    }

    if (this.chats.length === 0) {
      this.addNewChat();
    }

    setTimeout(() => this.scrollToBottom(), 0);
  }

  private saveChatsToUser(): void {
    if (this.currentUser) {
      this.currentUser.chats = this.chats;

      const savedUsers = this._localService.getData('users');
      if (savedUsers) {
        const allUsers: User[] = JSON.parse(savedUsers);

        const userIndex = allUsers.findIndex(user => user.username === this.currentUser!.username);
        if (userIndex !== -1) {
          allUsers[userIndex] = this.currentUser;

          this._localService.saveData('users', JSON.stringify(allUsers));
          this._localService.saveData('currentUser', JSON.stringify(this.currentUser));
        }
      }
    }

    this._localService.saveData('chats', JSON.stringify(this.chats));
  }

  public addNewChat(): void {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Новый чат`,
      messages: [{ text: this.INITIAL_MESSAGE, isUser: false }]
    };

    this.chats.push(newChat);
    this.activeChat = newChat.id;
    this.saveChatsToUser();
    this._localService.saveData('activeChat', this.activeChat);
    setTimeout(() => this.scrollToBottom(), 0);
    setTimeout(() => this._focusInputService.focusInput(), 0);
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

      const language: string = this.getLanguageFromCodeBlock(codeBlock);

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

  private getLanguageFromCodeBlock(codeBlock: Element): string {
    const codeElement = codeBlock.querySelector('code');
    if (!codeElement) return 'code';

    const className = codeElement.className;

    if (className.includes('language-')) {
      return className.split('language-')[1]
        .split(' ')[0];
    }

    if (className.includes('hljs')) {
      const match: RegExpMatchArray | null = className.match(/hljs-(\w+)/);
      return match ? match[1] : 'code';
    }

    return 'code';
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
    if (!this.userInput.trim() || this.isLoading) return;

    const userMessage = this.userInput.trim();
    this.userInput = '';

    const currentChat = this.chats.find(c => c.id === this.activeChat);
    if (!currentChat) return;

    currentChat.messages.push({ text: userMessage, isUser: true });

    if (currentChat.title === 'Новый чат' && userMessage.length > 0) {
      currentChat.title = userMessage.length > 30 ? userMessage.substring(0, 30) + '...' : userMessage;
    }

    this.saveChatsToUser();
    setTimeout(() => this.scrollToBottom(), 0);

    this.isLoading = true;

    try {
      const response = await this._mistralApiService.getAPIResponse(currentChat.messages);
      currentChat.messages.push({ text: response, isUser: false });
      this.saveChatsToUser();
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      currentChat.messages.push({
        text: 'Извините, произошла ошибка при получении ответа. Попробуйте еще раз.',
        isUser: false
      });
      this.saveChatsToUser();
    } finally {
      this.isLoading = false;
      setTimeout(() => this.scrollToBottom(), 0);
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

  public toLogout(): void {
    this._authService.logout();
  }
}
