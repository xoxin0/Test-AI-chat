import {
  ElementRef,
  Injectable
} from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class ScrollToBottomService {
  public scrollToBottom(messagesContainer: ElementRef): void {
    setTimeout(() => {
      if (messagesContainer) {
        const container: HTMLElement = messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }
}
