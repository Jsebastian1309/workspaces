import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type StatusType = 'todo' | 'in-progress' | 'done' | 'blocked' | 'custom';

export interface StatusItem {
  id: string;
  name: string;
  color: string; // hex or css color
  type: StatusType;
}

export interface StatusTemplate {
  id: string;
  name: string;
  tipo: string; // Ejemplo: 'Desarrollo', 'Marketing', etc.
  statuses: StatusItem[];
  updatedAt: number;
}

@Injectable({ providedIn: 'root' })
export class TemplatesService {
  private readonly STORAGE_KEY = 'statusTemplates';
  private readonly MAP_KEY = 'listTemplateMap';
  private readonly CAT_KEY = 'statusTemplateCategories';
  private templates$ = new BehaviorSubject<StatusTemplate[]>([]);
  private categories$ = new BehaviorSubject<string[]>([]);

  constructor() {
    const seeded = this.loadFromStorage();
    if (!seeded || seeded.length === 0) {
      const defaults = this.defaultTemplates();
      this.templates$.next(defaults);
      this.saveToStorage(defaults);
    } else {
      this.templates$.next(seeded);
    }
    // Load categories from storage, or derive defaults
    const storedCats = this.loadCategories();
    if (!storedCats || storedCats.length === 0) {
      const derived = Array.from(new Set(this.getSnapshot().map(t => t.tipo || 'General')));
      const base = Array.from(new Set(['General', ...derived]));
      this.categories$.next(base);
      this.saveCategories(base);
    } else {
      this.categories$.next(storedCats);
    }
  }

  // --- List to Template mapping ---
  setListTemplate(listIdent: string, templateId: string): void {
    if (!listIdent || !templateId) return;
    const map = this.loadMap();
    map[listIdent] = templateId;
    this.saveMap(map);
  }

  getListTemplate(listIdent: string | undefined | null): string | null {
    if (!listIdent) return null;
    const map = this.loadMap();
    return map[listIdent] || null;
  }

  getTemplateById(id: string | null | undefined): StatusTemplate | undefined {
    if (!id) return undefined;
    return this.getSnapshot().find(t => t.id === id);
  }

  getAll(): Observable<StatusTemplate[]> {
    return this.templates$.asObservable();
  }

  getSnapshot(): StatusTemplate[] {
    return this.templates$.getValue();
  }

  create(template: Omit<StatusTemplate, 'id' | 'updatedAt'>): StatusTemplate {
    const newItem: StatusTemplate = {
      ...template,
      id: this.uid(),
      updatedAt: Date.now(),
    };
  this.ensureCategory(newItem.tipo || 'General');
    const list = [...this.getSnapshot(), newItem];
    this.templates$.next(list);
    this.saveToStorage(list);
    return newItem;
  }

  update(updated: StatusTemplate): void {
    updated.updatedAt = Date.now();
  this.ensureCategory(updated.tipo || 'General');
    const list = this.getSnapshot().map(t => t.id === updated.id ? { ...updated } : t);
    this.templates$.next(list);
    this.saveToStorage(list);
  }

  delete(id: string): void {
    const list = this.getSnapshot().filter(t => t.id !== id);
    this.templates$.next(list);
    this.saveToStorage(list);
  }

  // --- Categories management ---
  getCategories(): Observable<string[]> {
    return this.categories$.asObservable();
  }

  getCategoriesSnapshot(): string[] { return this.categories$.getValue(); }

  addCategory(name: string): void {
    const n = (name || '').trim();
    if (!n) return;
    const cur = new Set(this.getCategoriesSnapshot());
    if (!cur.has(n)) {
      cur.add(n);
      const list = Array.from(cur);
      this.categories$.next(list);
      this.saveCategories(list);
    }
  }

  private ensureCategory(name: string) {
    const n = (name || 'General').trim();
    if (!n) return;
    const cur = new Set(this.getCategoriesSnapshot());
    if (!cur.has(n)) {
      cur.add(n);
      const list = Array.from(cur);
      this.categories$.next(list);
      this.saveCategories(list);
    }
  }

  private loadFromStorage(): StatusTemplate[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StatusTemplate[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(list: StatusTemplate[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore quota errors
    }
  }

  private loadMap(): Record<string, string> {
    try {
      const raw = localStorage.getItem(this.MAP_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  private saveMap(map: Record<string, string>): void {
    try { localStorage.setItem(this.MAP_KEY, JSON.stringify(map)); } catch { /* noop */ }
  }

  private loadCategories(): string[] {
    try {
      const raw = localStorage.getItem(this.CAT_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : [];
    } catch { return []; }
  }

  private saveCategories(list: string[]): void {
    try { localStorage.setItem(this.CAT_KEY, JSON.stringify(list)); } catch { /* noop */ }
  }

  private defaultTemplates(): StatusTemplate[] {
    const simple: StatusTemplate = {
      id: this.uid(),
      name: 'Simple',
      tipo: 'Desarrollo',
      updatedAt: Date.now(),
      statuses: [
        { id: this.uid(), name: 'To Do', color: '#9E9E9E', type: 'todo' },
        { id: this.uid(), name: 'In Progress', color: '#03A9F4', type: 'in-progress' },
        { id: this.uid(), name: 'Done', color: '#4CAF50', type: 'done' },
      ],
    };
    const bugflow: StatusTemplate = {
      id: this.uid(),
      name: 'Bug Flow',
      tipo: 'Marketing',
      updatedAt: Date.now(),
      statuses: [
        { id: this.uid(), name: 'Reported', color: '#FF9800', type: 'custom' },
        { id: this.uid(), name: 'Triaged', color: '#9C27B0', type: 'in-progress' },
        { id: this.uid(), name: 'Fixing', color: '#03A9F4', type: 'in-progress' },
        { id: this.uid(), name: 'QA', color: '#795548', type: 'custom' },
        { id: this.uid(), name: 'Done', color: '#4CAF50', type: 'done' },
      ],
    };
    return [simple, bugflow];
  }

  private uid(): string {
    return 't_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }
}
