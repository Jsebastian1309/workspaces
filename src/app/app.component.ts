import { Component } from '@angular/core';
import { I18nService } from './service/core/i18n/i18n.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'workspaces';

  constructor(private i18nService: I18nService) {
   
  }
  ngOnInit() {
    this.i18nService.init(environment.defaultLanguage, environment.supportedLanguages);
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    }
  }

  ngOnDestroy() {
    this.i18nService.destroy();
  }
  toggleTheme() {
    document.body.classList.toggle('dark-theme');
  }
}
