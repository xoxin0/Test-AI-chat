import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {NgIf, NgOptimizedImage} from '@angular/common';
import { NavigateService } from '../../../services/navigate.service';
import { User } from '../../../interfaces/user';
import { LocalStorageService } from '../../../services/local-storage.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    NgOptimizedImage,
    NgIf
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent implements OnInit {
  private _navigateService = inject(NavigateService);
  private _localStorageService = inject(LocalStorageService);
  private _authService = inject(AuthService);

  public loginForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4), Validators.maxLength(16)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  ngOnInit(): void {
    if (this._authService.isAuthenticated()) {
      this._navigateService.navigateToMainChat();
    }
  }

  public goRegister(): void {
    this._navigateService.navigateToRegister();
  }

  public goMainChat(): void {
    this._navigateService.navigateToMainChat();
  }

  public onLogin(): void {
    if (this.loginForm.invalid) {
      alert('Пожалуйста, заполните все поля корректно');
      return;
    }

    const loginData = {
      username: this.loginForm.value.username!,
      password: this.loginForm.value.password!
    };

    const savedUsers = this._localStorageService.getData('users');

    if (!savedUsers) {
      alert('Пользователь не найден. Пожалуйста, зарегистрируйтесь');
      return;
    }

    const allUsers: User[] = JSON.parse(savedUsers);

    const user = allUsers.find(user =>
      user.username === loginData.username && user.password === loginData.password
    );

    if (!user) {
      alert('Неверное имя пользователя или пароль');
      return;
    }

    this._authService.login(user);

    alert(`Добро пожаловать, ${user.username}!`);
    this.goMainChat();
  }
}
