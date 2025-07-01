import {
  inject,
  Injectable
} from '@angular/core';

import { TuiAlertService } from '@taiga-ui/core';

@Injectable({
  providedIn: 'root'
})

export class ErrorAlertService {
  private _alerts = inject(TuiAlertService);

  public showErrorLoadChatsNotification(): void {
    this._alerts
      .open('<strong>Произошла ошибка при загрузке чатов</strong>', { label: 'Ошибка' })
      .subscribe();
  }

  public showErrorHighlightCodeNotification(): void {
    this._alerts
      .open('<strong>Произошла ошибка при подсветке кода</strong>', { label: 'Ошибка' })
      .subscribe();
  }

  public showErrorCopyCodeNotification(): void {
    this._alerts
      .open('<strong>Произошла ошибка при копировании текста</strong>', { label: 'Ошибка' })
      .subscribe();
  }

  public showErrorMistralResponseNotification(): void {
    this._alerts
      .open('<strong>Произошла ошибка при получении ответа. Попробуйте еще раз.</strong>', { label: 'Ошибка' })
      .subscribe();
  }

  public showErrorDataNotification(): void {
    this._alerts
      .open('<strong>Пользователь уже существует</strong>', { label: 'Ошибка' })
      .subscribe();
  }

  public showErrorFormNotification(): void {
    this._alerts
      .open('<strong>Пожалуйста, заполните все поля корректно</strong>', { label: 'Ошибка' })
      .subscribe();
  }

  public showErrorDataFormNotification(): void {
    this._alerts
      .open('<strong>Неверное имя пользователя или пароль</strong>', {label: 'Ошибка'})
      .subscribe();
  }
}
