import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class VisibilityPassService {
  public passwordVisible: boolean = false;

  public togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;

    const passwordInput = document.getElementById('input-password') as HTMLInputElement;
    const eyeIcon = document.getElementById('eye-icon') as HTMLImageElement;

    if (this.passwordVisible) {
      passwordInput.type = 'text';
      eyeIcon.src = 'assets/eye-visible.svg';
    } else {
      passwordInput.type = 'password';
      eyeIcon.src = 'assets/eye-notvisible.svg';
    }
  }
}
