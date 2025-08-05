import { Component } from '@angular/core';
import { I18nService } from 'src/app/service/i18n.service';

@Component({
  selector: 'app-theme-button',
  templateUrl: './theme-button.component.html',
  styleUrls: ['./theme-button.component.scss']
})
export class ThemeButtonComponent {
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


