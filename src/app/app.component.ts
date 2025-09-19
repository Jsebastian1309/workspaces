import { Component } from '@angular/core';
import { I18nService } from './service/core/i18n/i18n.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Workspaces';
  constructor(private i18nService: I18nService) { 
  }
  ngOnInit() {
    // Initialize i18n service language Page
    this.i18nService.init(environment.defaultLanguage, environment.supportedLanguages);
  }
}
