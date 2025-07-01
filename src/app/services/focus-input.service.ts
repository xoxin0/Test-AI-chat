import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class FocusInputService {
  public focusInput(): void {
    document.querySelector("textarea")!.focus();
  }
}
