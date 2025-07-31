import { Injectable } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import enUS from '../../translations/en_US.json';
import esCO from '../../translations/es_CO.json';

const languageKey = 'language';

export function extract(s: string) {
  return s;
}

@Injectable()
export class I18nService {
  defaultLanguage!: string;
  supportedLanguages!: string[];

  private langChangeSubscription!: Subscription;

  constructor(private translateService: TranslateService) {
    translateService.setTranslation('en-US', enUS);
    translateService.setTranslation('es-CO', esCO);
  }

  init(defaultLanguage: string, supportedLanguages: string[]) {
    this.defaultLanguage = defaultLanguage;
    this.supportedLanguages = supportedLanguages;
    this.language = '';

    this.langChangeSubscription = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      localStorage.setItem(languageKey, event.lang);
    });
  }
  destroy() {
    this.langChangeSubscription.unsubscribe();
  }

  set language(language: string) {
    language = language || localStorage.getItem(languageKey) || this.defaultLanguage;
    let isSupportedLanguage = this.supportedLanguages.includes(language);
    if (language && !isSupportedLanguage) {
      language = language.split('-')[0];
      language = this.supportedLanguages.find(supportedLanguage => supportedLanguage.startsWith(language)) || '';
      isSupportedLanguage = Boolean(language);
    }
    if (!isSupportedLanguage) {
      language = this.defaultLanguage;
    }
    this.translateService.use(language);
  }
  get language(): string {
    return this.translateService.currentLang;
  }
}
