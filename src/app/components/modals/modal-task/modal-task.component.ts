import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Task } from 'src/app/models/task.model';
import { TaskAuditService } from 'src/app/service/features/task/task-audit.service';
import { TaskService } from 'src/app/service/features/task/Task.service';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { finalize } from 'rxjs/operators';

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
  @Input() isCreateMode = false; // New input to determine if creating new task

  // Edit mode flag (enabled by default for create mode, optional for view mode)
  canEdit = false;
  
  enableEdit() {
    this.canEdit = true;
  }

  @Output() close = new EventEmitter<void>();
  @Output() updateTask = new EventEmitter<Task>();
  @Output() createTask = new EventEmitter<Task>(); // New output for creating tasks

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
    if (!this.isCreateMode) {
      this.updateTask.emit(updated);
    }
  }

  saveNewTask() {
    if (!this.task || !this.isCreateMode) return;

    const taskToCreate: Task = { ...this.task };
    if (!taskToCreate.fechaCreacionTarea) {
      taskToCreate.fechaCreacionTarea = new Date().toISOString().split('T')[0];
    }

    this.createTask.emit(taskToCreate);
    this.close.emit();
  }

  saveExistingTask() {
    if (!this.task || this.isCreateMode) return;
    
    this.saveLoading = true;
    this.saveError = undefined;
    
    // Prepare task data for backend
    const currentUser = this.authService.getCurrentUser();
    const taskData = {
      identificador: this.task.identificador,
      nombre: this.task.nombre,
      descripcion: this.task.descripcion,
      estado: this.task.estado,
      progreso: this.task.progreso,
      prioridad: this.task.prioridad,
      fechaInicio: this.task.fechaInicio,
      fechaFin: this.task.fechaFin,
      fechaVencimiento: this.task.fechaVencimiento,
      duracionHoras: this.task.duracionHoras,
      etiqueta: this.task.etiqueta,
      comentarios: this.task.comentarios,
      asignadoA: this.task.asignadoA,
      tipoTarea: this.task.tipoTarea,
      listaIdentificador: this.task.listaIdentificador,
      espacioTrabajoIdentificador: this.task.espacioTrabajoIdentificador,
      // Extended fields
      fechaCreacionTarea: this.task.fechaCreacionTarea || new Date().toISOString().split('T')[0],
      fechaCerrada: this.task.fechaCerrada,
      fechaTerminada: this.task.fechaTerminada,
      facturable: this.task.facturable,
      responsableIdentificador: this.task.responsableIdentificador || this.task.asignadoA,
      tareaPadreIdentificador: (this.task as any).tareaPadreIdentificador,
      horaInicio: (this.task as any).horaInicio,
      horaFin: (this.task as any).horaFin,
      timezone: (this.task as any).timezone,
      localizacion: (this.task as any).localizacion,
      tipoNotificacion: (this.task as any).tipoNotificacion,
      minutosNotificacion: (this.task as any).minutosNotificacion,
      // Auth context
      organizacionId: currentUser?.organizacionId,
      clienteId: currentUser?.clienteId
    };

    this.taskService.actualizarTarea(taskData).pipe(
      finalize(() => this.saveLoading = false)
    ).subscribe({
      next: (response) => {
        console.log('Task updated successfully:', response);
        this.updateTask.emit(this.task!);
        this.saveError = undefined;
        // Reload audit log after successful update
        this.loadAudit();
        // Optionally close modal after successful save
        // this.close.emit();
      },
      error: (error) => {
        console.error('Error updating task:', error);
        this.saveError = 'Error al actualizar la tarea. Por favor intenta de nuevo.';
      }
    });
  }

  getPriorityColor(priority?: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgente': return '#e53935';
      case 'alta': return '#f6c343';
      case 'normal': return '#4f75ff';
      case 'baja': return '#9e9e9e';
      default: return '#9aa0a6';
    }
  }

  getPriorityLabel(priority?: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgente': return 'Urgente';
      case 'alta': return 'Alta';
      case 'normal': return 'Normal';
      case 'baja': return 'Baja';
      default: return 'Ninguna';
    }
  }

  // Bitácora (audit log)
  auditLoading = false;
  auditError?: string;
  audit: any[] = [];
  
  // Loading states
  saveLoading = false;
  saveError?: string;

  constructor(
    private taskAudit: TaskAuditService,
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedIndex'] || changes['tasks'] || changes['show']) {
      this.loadAudit();
    }
    // Enable edit mode for create mode
    if (changes['isCreateMode'] && this.isCreateMode) {
      this.canEdit = true;
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
