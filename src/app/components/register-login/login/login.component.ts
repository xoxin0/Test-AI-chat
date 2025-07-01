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
import { UsersApiService } from '../../../services/users-api.service';
import { VisibilityPassService } from '../../../services/visibility-pass.service';
import { ErrorAlertService } from '../../../services/error-alert.service';

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

  protected readonly _visibilityPassService: VisibilityPassService = inject(VisibilityPassService);

  private _allUsers: User[] = [];
  private _destroy$: Subject<void> = new Subject<void>();
  private readonly _navigateService: NavigateService = inject(NavigateService);
  private readonly _authService: AuthService = inject(AuthService);
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

  public goRegister(): void {
    this._navigateService.navigateToRegister();
  }

  public goMainChat(): void {
    this._navigateService.navigateToMainChat();
  }

  public onLogin(): void {
    if (this.loginForm.invalid) {
      this._errorAlertService.showErrorFormNotification()
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
      this._errorAlertService.showErrorDataFormNotification();
      return;
    }

    this._authService.login(user);

    this.goMainChat();
  }
}
