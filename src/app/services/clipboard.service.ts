import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class ClipboardService {
  copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
  }
}
