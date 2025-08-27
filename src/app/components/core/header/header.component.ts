import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { I18nService } from 'src/app/service/core/i18n/i18n.service';
import { User } from 'src/app/service/core/auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  public currentLanguage: string = '';
  public currentUser: User | null = null;
  public isDarkTheme: boolean = false;


  constructor(
    private i18nService: I18nService,
    private authService: AuthService,
    private router: Router
  ) { }
  ngOnInit() {
    this.currentLanguage = this.i18nService.language;
    this.currentUser = this.authService.getCurrentUser();
  }

  changeLanguage(langCode: string) {
    this.currentLanguage = langCode;
    this.i18nService.language = langCode;
  }

  onProfile() {
    this.router.navigate(['/profile']);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
  }

}
