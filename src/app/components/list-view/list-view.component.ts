import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TaskService } from 'src/app/service/task.service';
import { Task } from 'src/app/models/task.model';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent implements OnChanges {
  @Input() list: any;
  // Optional: bring the whole tree filter so buscarFiltrado trae toda la tarea del contexto
  @Input() espacioTrabajoIdentificador?: string;
  @Input() espacioIdentificador?: string;
  @Input() carpetaIdentificador?: string;

  loading = false;
  error?: string;
  info?: string;
  grouped: { [status: string]: Task[] } = {};

  statuses: { key: string; label: string; color: string }[] = [
    { key: 'BLOCKED', label: 'BLOCKED', color: '#6A4CFF' },
    { key: 'PENDING', label: 'PENDING', color: '#FFB020' },
    { key: 'DONE', label: 'COMPLETADA', color: '#38B87C' },
    { key: 'OPEN', label: 'OPEN', color: '#9AA0A6' },
  ];

  // UI state for inline create/edit
  addingFor: string | null = null;
  draft: Partial<Task> = {};
  editing: Record<string, boolean> = {};
  backups: Record<string, Task> = {};
  priorities = ['Low', 'Medium', 'High'];

  constructor(private tasks: TaskService) {}

  ngOnChanges(changes: SimpleChanges): void {
  const listChanged = !!changes['list'];
  const filtersChanged = !!(changes['espacioTrabajoIdentificador'] || changes['espacioIdentificador'] || changes['carpetaIdentificador']);
  if ((listChanged || filtersChanged) && this.list?.identificador) this.fetch();
  }

  private fetch() {
    this.loading = true;
    this.error = undefined;
    this.grouped = {};
    const params: any = {
      listaIdentificador: this.list?.identificador,
      espacioTrabajoIdentificador: this.espacioTrabajoIdentificador || this.list?.espacioTrabajoIdentificador,
      espacioIdentificador: this.espacioIdentificador || this.list?.espacioIdentificador,
      carpetaIdentificador: this.carpetaIdentificador || this.list?.carpetaIdentificador,
    };
    this.tasks.searchTasksFiltered(params).subscribe({
      next: (items) => {
        const byStatus: { [k: string]: Task[] } = {};
        const safe = Array.isArray(items) ? items : [];
        for (const t of safe) {
          const label = (t.estadoLabel || t.estado || 'Sin estado').toString();
          const key = label; // use backend label as grouping key
          byStatus[key] = byStatus[key] || [];
          byStatus[key].push(t);
        }
        this.grouped = byStatus;
      },
      error: (e) => {
        this.error = e?.message || 'Error loading tasks';
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  assigneeLabel(a: any): string {
    if (!a) return '';
    if (typeof a === 'string') return a;
    return a.nombre || a.username || a.id || '';
  }

  // Helpers for UI
  trackById(_i: number, t: Task) { return t.identificador; }

  startAdd(status: string) {
    this.addingFor = status;
    this.draft = {
      identificador: 'tmp_' + Date.now(),
      nombre: '',
      estado: status,
      prioridad: 'Medium',
      listaIdentificador: this.list?.identificador
    };
  }

  cancelAdd() { this.addingFor = null; this.draft = {}; }

  saveAdd() {
    if (!this.addingFor) return;
    const k = this.addingFor;
    if (!this.draft.nombre) return; // simple guard
    this.ensureGroup(k);
    this.grouped[k].unshift(this.draft as Task);
  this.info = 'Task added locally';
    this.cancelAdd();
  }

  startEdit(t: Task) {
    this.editing[t.identificador] = true;
    this.backups[t.identificador] = JSON.parse(JSON.stringify(t));
  }

  cancelEdit(t: Task) {
    const b = this.backups[t.identificador];
    if (b) {
      // If status changed while editing, move back to original group
      if ((t.estado || 'OPEN') !== (b.estado || 'OPEN')) {
        this.moveBetweenGroups(t, b.estado || 'OPEN');
      }
      Object.assign(t, b);
      delete this.backups[t.identificador];
    }
    delete this.editing[t.identificador];
  }

  saveEdit(t: Task) {
    // Local-only save. In future, call TaskService.update
    delete this.backups[t.identificador];
    delete this.editing[t.identificador];
  this.info = 'Task saved locally';
  }

  onStatusChange(t: Task, newStatus: string) {
    if ((t.estado || 'OPEN') === newStatus) return;
    this.moveBetweenGroups(t, newStatus);
  }

  private moveBetweenGroups(t: Task, newStatus: string) {
    const old = (t.estado || 'OPEN').toUpperCase();
    const ns = (newStatus || 'OPEN').toUpperCase();
    if (!this.grouped[old]) return;
    this.grouped[old] = this.grouped[old].filter(x => x.identificador !== t.identificador);
    this.ensureGroup(ns);
    t.estado = ns;
    this.grouped[ns].unshift(t);
  }

  private ensureGroup(k: string) { this.grouped[k] = this.grouped[k] || []; }

  visibleStatuses(): string[] {
    // Collect statuses with tasks only
    return Object.keys(this.grouped).filter(k => (this.grouped[k] || []).length > 0);
  }

  getStatusMeta(key: string) {
    // Compute color heuristically from label (backend driven)
    const s = (key || '').toString().toUpperCase();
    let color = '#9AA0A6';
    if (/(COMPLET|DONE|CERRAD|TERMINAD)/.test(s)) color = '#38B87C';
    else if (/(PEND)/.test(s)) color = '#FFB020';
    else if (/(BLOCK|BLOQUE)/.test(s)) color = '#6A4CFF';
    else if (/(OPEN|ABIERT)/.test(s)) color = '#9AA0A6';
    return { key: s, label: key, color };
  }

  hasAnyTasks(): boolean {
    return Object.keys(this.grouped).some(k => (this.grouped[k] || []).length > 0);
  }
}
