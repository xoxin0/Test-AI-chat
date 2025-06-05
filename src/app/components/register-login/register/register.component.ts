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

  public registerForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4), Validators.maxLength(16)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  public onRegister(): void {
    console.debug(this.registerForm.value);

    this.goMainChat();
  }

  public goLogin(): void {
    this._navigateService.navigateToLogin();
  }

  public goMainChat(): void {
    this._navigateService.navigateToMainChat();
  }
}
