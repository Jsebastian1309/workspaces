import { Component, OnInit } from '@angular/core';
import { TemplatesService, StatusTemplate, StatusItem } from 'src/app/service/templates.service';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.scss']
})
export class TemplatesComponent implements OnInit {
  templates: StatusTemplate[] = [];
  selected: StatusTemplate | null = null;
  draftName = '';
  categories: string[] = [];
  selectedCategory: string | null = null;

  constructor(private templatesService: TemplatesService) {}

  ngOnInit(): void {
    this.templatesService.getAll().subscribe(list => {
      this.templates = list;
      this.categories = this.computeCategories(list);
      if (!this.selectedCategory || !this.categories.includes(this.selectedCategory)) {
        this.selectedCategory = this.categories[0] || 'General';
      }
      if (!this.selected && list.length) {
        const preferred = list.find(t => (t.tipo || 'General') === (this.selectedCategory || 'General')) || list[0];
        this.select(preferred);
      } else if (this.selected) {
        const updated = list.find(t => t.id === this.selected!.id);
        if (updated) this.selected = { ...updated };
      }
    });

    this.templatesService.getCategories().subscribe(cats => {
      this.categories = cats || [];
      if (!this.selectedCategory || !this.categories.includes(this.selectedCategory)) {
        this.selectedCategory = this.categories[0] || 'General';
      }
    });
  }

  select(t: StatusTemplate) {
    this.selected = { ...t, statuses: t.statuses.map(s => ({ ...s })) };
    this.draftName = this.selected.name;
  }

  addStatus() {
    if (!this.selected) return;
    const newStatus: StatusItem = {
      id: this.uid(),
      name: 'New Status',
      color: '#607D8B',
      type: 'custom',
    };
    this.selected.statuses = [...this.selected.statuses, newStatus];
  }

  removeStatus(i: number) {
    if (!this.selected) return;
    this.selected.statuses = this.selected.statuses.filter((_, idx) => idx !== i);
  }

  moveStatus(i: number, dir: -1 | 1) {
    if (!this.selected) return;
    const j = i + dir;
    if (j < 0 || j >= this.selected.statuses.length) return;
    const arr = [...this.selected.statuses];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    this.selected.statuses = arr;
  }

  saveTemplate() {
    if (!this.selected) return;
    const payload: StatusTemplate = {
      ...this.selected,
      name: this.draftName.trim() || this.selected.name,
    };
    this.templatesService.update(payload);
  }

  createTemplate() {
    const base: Omit<StatusTemplate, 'id' | 'updatedAt'> = {
  name: 'New Template',
  tipo: this.selectedCategory || 'General',
      statuses: [
        { id: this.uid(), name: 'To Do', color: '#9E9E9E', type: 'todo' },
        { id: this.uid(), name: 'In Progress', color: '#03A9F4', type: 'in-progress' },
        { id: this.uid(), name: 'Done', color: '#4CAF50', type: 'done' },
      ],
    };
    const created = this.templatesService.create(base);
    this.select(created);
  }

  deleteTemplate() {
    if (!this.selected) return;
    const id = this.selected.id;
    this.templatesService.delete(id);
    this.selected = null;
  }

  changeCategory(cat: string) {
    this.selectedCategory = cat || 'General';
  }

  templatesBySelectedCategory(): StatusTemplate[] {
    const cat = this.selectedCategory || 'General';
    return this.templates.filter(t => (t.tipo || 'General') === cat);
  }

  private computeCategories(list: StatusTemplate[]): string[] {
    const s = new Set<string>();
    for (const t of list) s.add(t.tipo || 'General');
    return Array.from(s);
  }

  addCategoryUI() {
    const name = prompt('Nueva categoría (ej: Desarrollo, Marketing):');
    if (name) {
      this.templatesService.addCategory(name);
      this.selectedCategory = name;
    }
  }

  private uid(): string {
    return 's_' + Math.random().toString(36).slice(2, 9);
  }
}
