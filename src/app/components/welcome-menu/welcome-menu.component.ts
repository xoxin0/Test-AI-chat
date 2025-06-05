import {
  Component,
  inject
} from '@angular/core';

import { NgOptimizedImage } from '@angular/common';
import { NavigateService } from '../../services/navigate.service';

@Component({
  selector: 'app-welcome-menu',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './welcome-menu.component.html',
  styleUrl: './welcome-menu.component.scss'
})
export class WelcomeMenuComponent {
  private _navigateService = inject(NavigateService);

  public navigateToMainChat() {
    this._navigateService.navigateToLogin();
  }
}
