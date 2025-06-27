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
import { TuiAlertService } from '@taiga-ui/core';
import { UsersApiService } from '../../../services/users-api.service';

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
  public loginForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4), Validators.maxLength(16)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  private _allUsers: User[] = [];
  private _destroy$: Subject<void> = new Subject<void>();
  private _navigateService: NavigateService = inject(NavigateService);
  private _authService: AuthService = inject(AuthService);
  private readonly _alerts: TuiAlertService = inject(TuiAlertService);
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

  public goRegister(): void {
    this._navigateService.navigateToRegister();
  }

  public goMainChat(): void {
    this._navigateService.navigateToMainChat();
  }

  public onLogin(): void {
    if (this.loginForm.invalid) {
      this.showErrorFormNotification()
      return;
    }

    const loginData = {
      username: this.loginForm.value.username!,
      password: this.loginForm.value.password!
    };

    const user: User | undefined = this._allUsers.find(user =>
      user.username === loginData.username && user.password === loginData.password
    );

    if (!user) {
      this.showErrorDataNotification();
      return;
    }

    this._authService.login(user);

    this.goMainChat();
  }

  private showErrorDataNotification(): void {
    this._alerts
      .open('<strong>Неверное имя пользователя или пароль</strong>', {label: 'Ошибка'})
      .subscribe();
  }

  private showErrorFormNotification(): void {
    this._alerts
      .open('<strong>Некорректные данные</strong>', {label: 'Ошибка'})
      .subscribe();
  }
}
