import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { NavigateService } from './navigate.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _localStorageService = inject(LocalStorageService);
  private _navigateService = inject(NavigateService);

  public logout(): void {
    // Очищаем данные текущей сессии
    this._localStorageService.removeData('currentUser');
    this._localStorageService.removeData('chats');
    this._localStorageService.removeData('activeChat');

    // Переходим на страницу входа
    this._navigateService.navigateToLogin();
  }

  public getCurrentUser() {
    const savedUser = this._localStorageService.getData('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  }

  public isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
}
