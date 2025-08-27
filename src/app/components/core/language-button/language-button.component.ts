import { Component } from '@angular/core';
import { I18nService } from 'src/app/service/core/i18n/i18n.service';

@Component({
  selector: 'app-language-button',
  templateUrl: './language-button.component.html',
  styleUrls: ['./language-button.component.scss']
})
export class LanguageButtonComponent {
  public currentLanguage: string = '';
  public isDarkTheme: boolean = false;

  constructor(
      private i18nService: I18nService,
  ) { }


  changeLanguage(langCode: string) {
    this.currentLanguage = langCode;
    this.i18nService.language = langCode;
  }
  
  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
  }


}
