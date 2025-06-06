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
import {User} from '../../../interfaces/user';
import {LocalStorageService} from '../../../services/local-storage.service';

@Component({
  selector: 'app-register',
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})

export class RegisterComponent {
  private _navigateService = inject(NavigateService);
  private _localStorageService = inject(LocalStorageService);
  private readonly INITIAL_MESSAGE: string = 'Привет! Меня зовут TestAI. Чем я могу вам помочь сегодня?';

  public registerForm = new FormGroup({
    username: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4), Validators.maxLength(16)] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  public onRegister(): void {
    if (this.registerForm.invalid) {
      alert('Пожалуйста, заполните все поля корректно');
      return;
    }

    // Получаем всех пользователей из localStorage
    const savedUsers = this._localStorageService.getData('users');
    const allUsers: User[] = savedUsers ? JSON.parse(savedUsers) : [];

    // Проверяем, существует ли пользователь с таким именем
    const userExists = allUsers.some(user => user.username === this.registerForm.value.username!);

    if (userExists) {
      alert('Пользователь с таким именем уже существует');
      return;
    }

    // Создаем первый чат для нового пользователя
    const initialChat = {
      id: Date.now().toString(),
      title: 'Новый чат',
      messages: [{ text: this.INITIAL_MESSAGE, isUser: false }]
    };

    const newUser: User = {
      username: this.registerForm.value.username!,
      password: this.registerForm.value.password!,
      chats: [initialChat]
    };

    // Добавляем нового пользователя
    allUsers.push(newUser);

    // Сохраняем обновленный список пользователей
    this._localStorageService.saveData('users', JSON.stringify(allUsers));

    // Сохраняем текущего пользователя как активного
    this._localStorageService.saveData('currentUser', JSON.stringify(newUser));

    // Устанавливаем чаты пользователя и активный чат
    this._localStorageService.saveData('chats', JSON.stringify(newUser.chats));
    this._localStorageService.saveData('activeChat', initialChat.id);

    alert('Регистрация прошла успешно!');
    this.goMainChat();
  }

  public goLogin(): void {
    this._navigateService.navigateToLogin();
  }

  public goMainChat(): void {
    this._navigateService.navigateToMainChat();
  }
}
