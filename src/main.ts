import { bootstrapApplication } from '@angular/platform-browser';
import { provideMarkdown } from 'ngx-markdown';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideMarkdown(),
    provideRouter(routes)
  ]
})
