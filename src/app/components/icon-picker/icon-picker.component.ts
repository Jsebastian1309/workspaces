import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormControl } from '@angular/forms';

@Component({
  selector: 'app-icon-picker',
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss']
})
export class IconPickerComponent implements OnInit {
  @Input() formControlName!: string; 
  @Input() label: string = 'Icon';

  open = false;
  search = '';

  icons: string[] = [];

  filtered: string[] = [...this.icons];

  constructor(private controlContainer: ControlContainer) {}

  ngOnInit(): void {
    this.loadIcons();
  }

  private loadIcons() {
    const maxAttempts = 8;
    let attempt = 0;
    const tryExtract = () => {
      attempt++;
      const found = this.extractBootstrapIconClassNames();
      if (found.length > 0) {
        this.icons = found;
        this.filtered = [...found];
      } else if (attempt < maxAttempts) {
        setTimeout(tryExtract, 150);
      } else {
        this.useFallback();
      }
    };
    tryExtract();
  }

  private useFallback() {
    const fallback = [
      'bi-activity','bi-alarm','bi-archive','bi-bag','bi-bell','bi-bootstrap','bi-book','bi-bookmark','bi-box',
      'bi-briefcase','bi-building','bi-calendar','bi-chat','bi-check-circle','bi-clipboard','bi-cloud','bi-code',
      'bi-collection','bi-compass','bi-diagram-3','bi-display','bi-envelope','bi-exclamation-circle','bi-eye',
      'bi-flag','bi-folder','bi-gear','bi-gem','bi-globe','bi-grid','bi-heart','bi-house','bi-image','bi-inbox',
      'bi-journal','bi-key','bi-layers','bi-lightning','bi-list','bi-lock','bi-map','bi-megaphone','bi-people',
      'bi-person','bi-pin','bi-rocket','bi-search','bi-shield','bi-sliders','bi-star','bi-tag','bi-terminal',
      'bi-tools','bi-trash','bi-trophy','bi-ui-checks','bi-upload','bi-wrench'
    ];
    this.icons = fallback;
    this.filtered = fallback;
  }

  private extractBootstrapIconClassNames(): string[] {
    const result = new Set<string>();
    const sheets = Array.from(document.styleSheets || []);
    for (const sheet of sheets) {
      let rules: CSSRuleList | undefined;
      try {
        rules = (sheet as any).cssRules as CSSRuleList | undefined;
      } catch {
        continue;
      }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        const styleRule = rule as CSSStyleRule;
        const selector = (styleRule && styleRule.selectorText) ? styleRule.selectorText : '';
        if (!selector) continue;
        if (selector.includes('.bi-') && selector.includes('::before')) {
          const matches = selector.match(/\.bi-[a-z0-9-]+/gi) || [];
          for (const m of matches) {
            const name = m.replace(/^\./, '');
            if (name !== 'bi') result.add(name);
          }
        }
      }
    }
    return Array.from(result).sort((a, b) => a.localeCompare(b));
  }

  get control(): FormControl | null {
    return this.controlContainer.control?.get(this.formControlName) as FormControl;
  }

  toggle() { this.open = !this.open; }

  filterIcons() {
    const term = this.search.toLowerCase().trim();
  this.filtered = term ? this.icons.filter(i => i.toLowerCase().includes(term)) : [...this.icons];
  }

  select(icon: string) {
    this.control?.setValue(icon);
    this.control?.markAsDirty();
    this.open = false;
  }

  clear(event: MouseEvent) {
    event.stopPropagation();
    this.control?.setValue('');
    this.control?.markAsDirty();
  }
}
