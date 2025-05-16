import {
  Component,
  inject
} from '@angular/core';

import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-welcome-menu',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './welcome-menu.component.html',
  styleUrl: './welcome-menu.component.scss'
})
export class WelcomeMenuComponent {
  private _router = inject(Router);

  public navigateToMainChat() {
    this._router.navigate(['main-chat']);
  }
}
