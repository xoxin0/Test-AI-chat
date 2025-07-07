import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
  AfterViewChecked,
  OnDestroy
} from '@angular/core';

import {
  NgForOf,
  NgIf,
  NgOptimizedImage
} from '@angular/common';

import {
  Subject,
  takeUntil
} from 'rxjs';

import { MarkdownModule } from 'ngx-markdown';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../../services/local-storage.service';
import { HeaderCodeService } from '../../services/header-code.service';
import { MistralApiService } from '../../services/mistral-api.service';
import { Message } from '../../interfaces/message';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { Chat } from '../../interfaces/chat';
import { FocusInputService } from '../../services/focus-input.service';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import { UsersApiService } from '../../services/users-api.service';
import { ErrorAlertService } from '../../services/error-alert.service';

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

export class MainChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  public chats: Chat[] = [];
  public activeChat: string = '';
  public userInput: string = '';
  public isLoading: boolean = false;
  public sidebarIsOpen: boolean = false;
  public currentUser: User | null = null;

  protected readonly _clipboardService: HeaderCodeService = inject(HeaderCodeService);
  protected readonly window: Window = window;

  private _allUsers: User[] = [];
  private readonly _errorAlertService = inject(ErrorAlertService);
  private readonly _localService: LocalStorageService = inject(LocalStorageService);
  private readonly _focusInputService: FocusInputService = inject(FocusInputService);
  private readonly _mistralApiService: MistralApiService = inject(MistralApiService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _usersApiService: UsersApiService = inject(UsersApiService);
  private readonly _destroy$: any = new Subject<void>();
  private readonly INITIAL_MESSAGE: string = 'Привет! Меня зовут TestAI. Чем я могу вам помочь сегодня?';

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('textareaRef') private textareaRef!: ElementRef<HTMLTextAreaElement>;

  public ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsersAndChats();
    this._focusInputService.focusInput();
  }

  public ngAfterViewChecked(): void {
    this._clipboardService.highlightCodeBlocks();
    this._clipboardService.addCopyButtonsAndViewToCodeBlocks();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this._clipboardService.cleanupBlobUrl();
  }

  public adjustTextareaHeight(): void {
    const textarea: HTMLTextAreaElement = this.textareaRef.nativeElement;
    const lineHeight = 24;
    const maxRows = 5;

    textarea.style.height = 'auto';

    const scrollHeight: number = textarea.scrollHeight;
    const rows: number = Math.floor(scrollHeight / lineHeight);

    if (scrollHeight <= maxRows * lineHeight) {
      textarea.style.height = `${ Math.min(rows, maxRows) * lineHeight }px`;
      textarea.style.overflowY = 'hidden';
    } else {
      textarea.style.height = `${ maxRows * lineHeight }px`;
      textarea.style.overflowY = 'auto';
    }
  }

  public getMessages(): Message[] {
    const chat: Chat | undefined = this.chats.find(chat => chat.id === this.activeChat);
    return chat ? chat.messages : [];
  }

  public toLogout(): void {
    this._authService.logout();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const container: HTMLElement = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }

  private loadCurrentUser(): void {
    if (this._localService.getData('currentUser')) {
      this.currentUser = JSON.parse(<string>this._localService.getData('currentUser'));
    }
  }

  private loadUsersAndChats(): void {
    this._usersApiService.getUsers()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (users: User[]): void => {
          this._allUsers = users;
          this.loadChats();
        },
        error: (): void => {
          this._errorAlertService.showErrorLoadChatsNotification();
          this.loadChats();
        }
      });
  }

  private loadChats(): void {
    if (this.currentUser && this.currentUser.chats) {
      this.chats = this.currentUser.chats;
    }

    const activeChat: string | null = this._localService.getData('activeChat');
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
    this.onCloseSidebar(false);
    setTimeout(() => this.scrollToBottom(), 0);
    setTimeout(() => this._focusInputService.focusInput(), 0);
  }

  private saveChatsToUser(): void {
    if (!this.currentUser) {
      return;
    }

    this.currentUser.chats = this.chats;
    this._localService.saveData('currentUser', JSON.stringify(this.currentUser));

    const userIndex = this._allUsers.findIndex(user => user.id === this.currentUser!.id);
    if (userIndex !== -1) {
      this._allUsers[userIndex] = { ...this.currentUser };
    }

    this._usersApiService.updateUser(this.currentUser)
      .pipe(
        takeUntil(this._destroy$)
      )
      .subscribe();

    this._localService.saveData('activeChat', this.activeChat);
  }

  public onSelectChat(chatId: string): void {
    this.activeChat = chatId;
    this._localService.saveData('activeChat', chatId);
    this.scrollToBottom();
    this._focusInputService.focusInput();
    this.onCloseSidebar(false);
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

    this.saveChatsToUser();
  }

  public onCloseSidebar(isOpen: boolean): void {
    this.sidebarIsOpen = isOpen;
  }

  public async sendMessage(): Promise<void> {
    if (!this.userInput.trim() || this.isLoading) return;

    const userMessage: string = this.userInput.trim();
    this.userInput = '';

    if (this.textareaRef) {
      this.textareaRef.nativeElement.style.height = 'auto';
    }

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
      const response: string = await this._mistralApiService.getAPIResponse(currentChat.messages);
      currentChat.messages.push({ text: response, isUser: false });
      this.saveChatsToUser();
    } catch (err) {
      currentChat.messages.push({
        text: 'Извините, произошла ошибка при получении ответа. Попробуйте еще раз.',
        isUser: false
      });

      this._errorAlertService.showErrorMistralResponseNotification();
      this.saveChatsToUser();
    } finally {
      this.isLoading = false;
      setTimeout((): void => this.scrollToBottom(), 0);
    }
  }
}
