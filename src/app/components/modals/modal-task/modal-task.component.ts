import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Task } from 'src/app/models/task.model';
import { TaskAuditService } from 'src/app/service/features/task/task-audit.service';

@Component({
  selector: 'app-modal-task',
  templateUrl: './modal-task.component.html',
  styleUrls: ['./modal-task.component.scss']
})
export class ModalTaskComponent implements OnChanges {
  @Input() show = false;
  @Input() tasks: Task[] = [];
  @Input() selectedIndex = 0;
  @Input() statuses: { key: string; label: string; color: string }[] = [];
  @Input() teams: { identificador: string; nombres?: string; nombre?: string }[] = [];

  // Edit mode flag (initially false; enabled once by user clicking Edit)
  canEdit = false;

  @Output() close = new EventEmitter<void>();
  @Output() updateTask = new EventEmitter<Task>();

  get hasPrev(): boolean { return this.selectedIndex > 0; }
  get hasNext(): boolean { return this.selectedIndex < (this.tasks.length - 1); }
  get task(): Task | null { return this.tasks[this.selectedIndex] ?? null; }

  trackById(_i: number, t: Task) { return t.identificador; }
  trackByAuditId(_i: number, a: any) { return a.id ?? _i; }

  onBackdropClick(e: MouseEvent) {
    // Only close if backdrop is clicked, not the modal content
    if ((e.target as HTMLElement)?.classList.contains('wt-modal')) {
      this.close.emit();
    }
  }

  prev() {
    if (this.hasPrev) this.selectedIndex -= 1;
  }
  next() {
    if (this.hasNext) this.selectedIndex += 1;
  }

  onFieldChange<K extends keyof Task>(key: K, value: Task[K]) {
    if (!this.task) return;
    const updated: Task = { ...(this.task as any), [key]: value } as Task;
    this.tasks[this.selectedIndex] = updated;
    this.updateTask.emit(updated);
  }

  // Bitácora (audit log)
  auditLoading = false;
  auditError?: string;
  audit: any[] = [];

  constructor(private taskAudit: TaskAuditService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedIndex'] || changes['tasks'] || changes['show']) {
      this.loadAudit();
    }
  }

  private loadAudit(): void {
    this.audit = [];
    this.auditError = undefined;
    if (!this.show || !this.task?.identificador) return;
    this.auditLoading = true;
    this.taskAudit.getTaskAudit(this.task.identificador).subscribe({
      next: (rows: any[]) => {
        const list = Array.isArray(rows) ? rows : [];
        // Sort by fechaModificacion desc if available, else by id desc
        this.audit = list.slice().sort((a, b) => {
          const da = a?.fechaModificacion ? new Date(a.fechaModificacion).getTime() : 0;
          const db = b?.fechaModificacion ? new Date(b.fechaModificacion).getTime() : 0;
          if (db !== da) return db - da;
          const ia = typeof a?.id === 'number' ? a.id : 0;
          const ib = typeof b?.id === 'number' ? b.id : 0;
          return ib - ia;
        });
      },
      error: (e: any) => { console.error('Audit error', e); this.auditError = 'No se pudo cargar la bitácora'; },
      complete: () => { this.auditLoading = false; }
    });
  }
}
