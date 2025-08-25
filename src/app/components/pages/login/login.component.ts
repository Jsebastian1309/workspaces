import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from 'src/app/service/core/i18n/i18n.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/service/core/auth/Auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  public currentLanguage: string = '';
  public isDarkTheme: boolean = false;
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  rememberMe: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private i18nService: I18nService,
  ) { }

  ngOnInit() {
    this.currentLanguage = this.i18nService.language;
  }

  // Toggle password visibility
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // Change language
  changeLanguage(langCode: string) {
    this.currentLanguage = langCode;
    this.i18nService.language = langCode;
  }

  // Login function
  onLogin() {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/Home']);
        } else {
          this.errorMessage = 'Invalid Credentials';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Login Error';
        this.isLoading = false;
      }
    });
  }
}