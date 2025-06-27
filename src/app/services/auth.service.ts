import {
  Injectable,
  inject
} from '@angular/core';

import { LocalStorageService } from './local-storage.service';
import { NavigateService } from './navigate.service';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private _localStorageService = inject(LocalStorageService);
  private _navigateService = inject(NavigateService);

  public login(user: User): void {
    this._localStorageService.saveData('currentUser', JSON.stringify(user));
    this._localStorageService.saveData('isLoggedIn', 'true');

    if (user.chats && user.chats.length > 0) {
      this._localStorageService.saveData('chats', JSON.stringify(user.chats));
      this._localStorageService.saveData('activeChat', user.chats[0].id);
    }
  }

  public logout(): void {
    this._localStorageService.removeData('currentUser');
    this._localStorageService.removeData('chats');
    this._localStorageService.removeData('activeChat');
    this._localStorageService.removeData('isLoggedIn');

    this._navigateService.navigateToLogin();
  }

  public getCurrentUser(): User | null {
    const savedUser: string | null = this._localStorageService.getData('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  }

  public isAuthenticated(): boolean {
    const isLoggedIn: string | null = this._localStorageService.getData('isLoggedIn');
    const currentUser: User | null = this.getCurrentUser();
    return isLoggedIn === 'true' && !!currentUser;
  }
}
