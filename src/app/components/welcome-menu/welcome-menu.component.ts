import {
  Component,
  inject
} from '@angular/core';

import { NgOptimizedImage } from '@angular/common';
import { NavigateService } from '../../services/navigate.service';
import { LocalStorageService } from '../../services/local-storage.service';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-welcome-menu',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './welcome-menu.component.html',
  styleUrl: './welcome-menu.component.scss'
})
export class WelcomeMenuComponent {
  private _navigateService: NavigateService = inject(NavigateService);
  private _localStorageService: LocalStorageService = inject(LocalStorageService);

  protected _currentUser: User = JSON.parse(<string>this._localStorageService.getData('currentUser'))
  protected _authService: AuthService = inject(AuthService);

  public navigateToMainChat() {
    this._navigateService.navigateToLogin();
  }
}
