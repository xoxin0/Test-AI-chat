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
import {User} from '../../../interfaces/user';
import {LocalStorageService} from '../../../services/local-storage.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})

export class RegisterComponent implements OnInit {
  private _navigateService = inject(NavigateService);
  private _localStorageService = inject(LocalStorageService);
  private _authService = inject(AuthService);
  private readonly INITIAL_MESSAGE: string = 'Привет! Меня зовут TestAI. Чем я могу вам помочь сегодня?';

  public registerForm = new FormGroup({
    username: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4), Validators.maxLength(16)] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  ngOnInit(): void {
    if (this._authService.isAuthenticated()) {
      this._navigateService.navigateToMainChat();
    }
  }

  public onRegister(): void {
    if (this.registerForm.invalid) {
      alert('Пожалуйста, заполните все поля корректно');
      return;
    }

    const savedUsers = this._localStorageService.getData('users');
    const allUsers: User[] = savedUsers ? JSON.parse(savedUsers) : [];

    const userExists = allUsers.some(user => user.username === this.registerForm.value.username!);

    if (userExists) {
      alert('Пользователь с таким именем уже существует');
      return;
    }

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

    allUsers.push(newUser);

    this._localStorageService.saveData('users', JSON.stringify(allUsers));

    this._authService.login(newUser);

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
