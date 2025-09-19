import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { setDefaultOptions } from 'date-fns';


import { enUS as enUSLocale, es as esLocale } from 'date-fns/locale';
import * as enUSTranslations from '../../../../translations/en_US.json';
import * as esCOTranslations from '../../../../translations/es_CO.json';


const languageKey = 'language';

const dateFnsLocales: { [key: string]: Locale } = {
  'en-US': enUSLocale,
  'es-CO': esLocale,
};

@Injectable({
  providedIn: 'root'
})
export class I18nService implements OnDestroy {
  defaultLanguage!: string;
  supportedLanguages!: string[];
  private langChangeSubscription!: Subscription;

  constructor(private translateService: TranslateService) {
    translateService.setTranslation('en-US', enUSTranslations);
    translateService.setTranslation('es-CO', esCOTranslations);
  }

  init(defaultLanguage: string, supportedLanguages: string[]) {
    this.defaultLanguage = defaultLanguage;
    this.supportedLanguages = supportedLanguages;
    this.language = '';
    this.langChangeSubscription = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      localStorage.setItem(languageKey, event.lang);
      this.applyLocales(event.lang);
    });
  }

  ngOnDestroy() {
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
    this.applyLocales(language);
  }

  get language(): string {
    return this.translateService.currentLang;
  }

  private applyLocales(language: string) {
    const locale = dateFnsLocales[language];
    if (locale) {
      setDefaultOptions({ locale: locale });
    } else {
      setDefaultOptions({ locale: enUSLocale });
    }
  }
  
  
}
export function appInitializerFactory(i18nService: I18nService): () => Promise<any> {
  return () => new Promise(resolve => {
    i18nService.init('es-CO', ['es-CO', 'en-US']);
    resolve(true);
  });
}