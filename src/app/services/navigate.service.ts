import {
  inject,
  Injectable
} from '@angular/core';

import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})

export class NavigateService {
  private _router = inject(Router);

  public navigateToMainChat(): void {
    this._router.navigate(['main-chat']);
  }

  public navigateToRegister(): void {
    this._router.navigate(['register']);
  }

  public navigateToLogin(): void {
    this._router.navigate(['login']);
  }
}
