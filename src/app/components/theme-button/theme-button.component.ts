import { Component, OnInit } from '@angular/core';
import { I18nService } from 'src/app/service/i18n.service';

@Component({
  selector: 'app-theme-button',
  templateUrl: './theme-button.component.html',
  styleUrls: ['./theme-button.component.scss']
})
export class ThemeButtonComponent implements OnInit {
  isDarkTheme = false;

  ngOnInit(): void {
    const saved = localStorage.getItem('theme');
    if (saved) {
      this.isDarkTheme = saved === 'dark';
    } else {
      this.isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    const body = document.body;
    body.classList.toggle('dark-theme', this.isDarkTheme);
    body.classList.toggle('light-theme', !this.isDarkTheme);
  }
}