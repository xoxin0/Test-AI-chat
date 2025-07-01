import {
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  NgIf,
  NgOptimizedImage
} from '@angular/common';

import {
  Subject,
  switchMap,
  takeUntil
} from 'rxjs';

import { NavigateService } from '../../../services/navigate.service';
import { User } from '../../../interfaces/user';
import { AuthService } from '../../../services/auth.service';
import { UsersApiService } from '../../../services/users-api.service';
import { VisibilityPassService } from '../../../services/visibility-pass.service';
import { ErrorAlertService } from '../../../services/error-alert.service';

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

export class RegisterComponent implements OnInit, OnDestroy {
  public registerForm = new FormGroup({
    username: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4), Validators.maxLength(16)] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  protected readonly _visibilityPassService: VisibilityPassService = inject(VisibilityPassService);

  private _destroy$: Subject<void> = new Subject<void>();
  private _allUsers: User[] = [];
  private readonly _navigateService = inject(NavigateService);
  private readonly _authService = inject(AuthService);
  private readonly INITIAL_MESSAGE: string = 'Привет! Меня зовут TestAI. Чем я могу вам помочь сегодня?';
  private readonly _errorAlertService = inject(ErrorAlertService);
  private readonly _usersApiService: UsersApiService = inject(UsersApiService);

  public ngOnInit(): void {
    if (this._authService.isAuthenticated()) {
      this._navigateService.navigateToMainChat();
    }

    this._usersApiService.getUsers()
      .pipe(
        takeUntil(this._destroy$),
        switchMap(users => users.map(user => this._allUsers.push(user)))
      )
      .subscribe();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onRegister(): void {
    if (this.registerForm.invalid) {
      this._errorAlertService.showErrorFormNotification();
      return;
    }

    const userExists: boolean = this._allUsers.some(user => user.username === this.registerForm.value.username!);

    if (userExists) {
      this._errorAlertService.showErrorDataNotification();
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

    this._allUsers.push(newUser);

    this._usersApiService.registerUser(newUser)
      .pipe(
        takeUntil(this._destroy$),
      )
      .subscribe()
    this._authService.login(newUser);

    this.goMainChat();
  }

  public goLogin(): void {
    this._navigateService.navigateToLogin();
  }

  public goMainChat(): void {
    this._navigateService.navigateToMainChat();
  }
}
