import {
  inject,
  Injectable
} from '@angular/core';

import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';

import { ErrorAlertService } from './error-alert.service';
import hljs from 'highlight.js';

@Injectable({
  providedIn: 'root'
})

export class HeaderCodeService {
  public showHtmlPreview: boolean = false;
  public htmlPreviewUrl: SafeResourceUrl | null = null;

  private _currentBlobUrl: string | null = null;
  private readonly _errorAlertService: ErrorAlertService = inject(ErrorAlertService);
  private readonly _sanitizer: DomSanitizer = inject(DomSanitizer);

  public copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
  }

  public copyCodeContent(codeBlock: Element, button: HTMLButtonElement): void {
    if (button.innerText !== 'Copy') {
      return;
    }

    const code: string = codeBlock.textContent || '';

    this.copyToClipboard(code)
      .then(() => {
        const originalText: string = button.innerText;
        button.innerText = 'Copied ✓';

        setTimeout(() => {
          button.innerText = originalText;
        }, 2000);
      })
      .catch(() => {
        this._errorAlertService.showErrorCopyCodeNotification();
        button.innerText = 'Ошибка';

        setTimeout(() => {
          button.innerText = 'Copy';
        }, 2000);
      });
  }

  public addCopyButtonsAndViewToCodeBlocks(): void {
    const codeBlocks: NodeListOf<Element> = document.querySelectorAll('pre:not(.copy-button-added)');

    codeBlocks.forEach(codeBlock => {
      // обертка для позиционирования хэдера с кодом
      const wrapper: HTMLDivElement = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
      wrapper.appendChild(codeBlock);

      const headerContainer: HTMLDivElement = document.createElement('div');
      headerContainer.className = 'code-header';

      const language: string = this.getLanguageFromCodeBlock(codeBlock);

      const languageLabel: HTMLSpanElement = document.createElement('span');
      languageLabel.className = 'language-label';
      languageLabel.innerText = language;

      const buttonsContainer: HTMLDivElement = document.createElement('div');
      buttonsContainer.className = 'code-buttons';

      const copyButton: HTMLButtonElement = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.innerText = 'Copy';
      copyButton.addEventListener('click', () => this.copyCodeContent(codeBlock, copyButton));

      if (language === 'html') {
        const simulationButton: HTMLButtonElement = document.createElement('button');
        simulationButton.className = 'simulation-button';
        simulationButton.innerText = 'View';

        simulationButton.addEventListener('click', () => {
          const htmlContent: string = codeBlock.querySelector('code')?.textContent || '';
          this.openHtmlSimulation(htmlContent);
        });

        buttonsContainer.appendChild(simulationButton);
      }

      buttonsContainer.appendChild(copyButton);
      headerContainer.appendChild(languageLabel);
      headerContainer.appendChild(buttonsContainer);

      wrapper.insertBefore(headerContainer, codeBlock);

      codeBlock.classList.add('copy-button-added');
    });
  }

  public getLanguageFromCodeBlock(codeBlock: Element): string {
    const codeElement: HTMLElement = codeBlock.querySelector('code')!;
    const className: string = codeElement.className;

    if (className.includes('language-')) {
      return className.split('language-')[1]
        .split(' ')[0];
    }

    if (className.includes('hljs')) {
      const match: RegExpMatchArray | null = className.match(/hljs-(\w+)/);
      return match ? match[1] : 'code';
    }

    return 'code';
  }

  public openHtmlSimulation(htmlContent: string): void {
    this.cleanupBlobUrl();

    const blob = new Blob([htmlContent], { type: 'text/html' });

    this._currentBlobUrl = URL.createObjectURL(blob);
    this.htmlPreviewUrl = this._sanitizer.bypassSecurityTrustResourceUrl(this._currentBlobUrl);

    this.showHtmlPreview = true;
  }

  public closeHtmlPreview(): void {
    this.showHtmlPreview = false;
    this.htmlPreviewUrl = null;
    this.cleanupBlobUrl();
  }

  public cleanupBlobUrl(): void {
    if (this._currentBlobUrl) {
      URL.revokeObjectURL(this._currentBlobUrl);
      this._currentBlobUrl = null;
    }
  }

  public highlightCodeBlocks(): void {
    const codeBlocks: NodeListOf<HTMLElement> = document.querySelectorAll('pre code:not(.hljs)');
    const inlineCodeBlocks: NodeListOf<HTMLElement> = document.querySelectorAll('code:not(pre code):not(.hljs)');

    codeBlocks.forEach((block: HTMLElement) => {
      try {
        hljs.highlightElement(block);
      } catch (error) {
        this._errorAlertService.showErrorHighlightCodeNotification();
      }
    });

    inlineCodeBlocks.forEach((block: HTMLElement) => {
      try {
        if (block.textContent && block.textContent.length > 2) {
          hljs.highlightElement(block);
        }
      } catch (error) {
        this._errorAlertService.showErrorHighlightCodeNotification();
      }
    });
  }
}
