import {
  Component,
  inject
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { NgOptimizedImage } from '@angular/common';
import { NavigateService } from '../../../services/navigate.service';
import { User } from '../../../interfaces/user';
import { LocalStorageService } from '../../../services/local-storage.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    NgOptimizedImage
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {
  private _navigateService = inject(NavigateService);
  private _localStorageService = inject(LocalStorageService);

  public loginForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4), Validators.maxLength(16)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

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

    // Получаем всех пользователей из localStorage
    const savedUsers = this._localStorageService.getData('users');

    if (!savedUsers) {
      alert('Пользователи не найдены. Пожалуйста, зарегистрируйтесь');
      return;
    }

    const allUsers: User[] = JSON.parse(savedUsers);

    // Ищем пользователя с указанными данными
    const user = allUsers.find(user =>
      user.username === loginData.username && user.password === loginData.password
    );

    if (!user) {
      alert('Неверное имя пользователя или пароль');
      return;
    }

    // Сохраняем текущего пользователя как активного
    this._localStorageService.saveData('currentUser', JSON.stringify(user));

    // Если у пользователя есть чаты, загружаем их
    if (user.chats && user.chats.length > 0) {
      this._localStorageService.saveData('chats', JSON.stringify(user.chats));
      this._localStorageService.saveData('activeChat', user.chats[0].id);
    }

    alert(`Добро пожаловать, ${user.username}!`);
    this.goMainChat();
  }
}
