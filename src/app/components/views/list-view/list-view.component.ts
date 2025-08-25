import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TaskService } from 'src/app/service/features/task/Task.service';
import { TemplatesService } from 'src/app/service/features/templates/Templates.service';
import { AuthService } from 'src/app/service/core/auth/Auth.service';
import { Task } from 'src/app/models/task.model';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent implements OnChanges {
  @Input() list: any;
  @Input() espacioTrabajoIdentificador?: string;
  @Input() espacioIdentificador?: string;
  @Input() carpetaIdentificador?: string;

  loading = false;
  error?: string;
  info?: string;
  grouped: { [status: string]: Task[] } = {};

  statuses: { key: string; label: string; color: string }[] = [];

  // UI state for inline create/edit
  addingFor: string | null = null;
  draft: Partial<Task> = {};
  editing: Record<string, boolean> = {};
  backups: Record<string, Task> = {};
  priorities = ['Low', 'Medium', 'High'];

  constructor(
    private tasks: TaskService, 
    private templates: TemplatesService,
    private authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const listChanged = !!changes['list'];
    const filtersChanged = !!(changes['espacioTrabajoIdentificador'] || changes['espacioIdentificador'] || changes['carpetaIdentificador']);
    if ((listChanged || filtersChanged) && this.list?.identificador) this.fetch();
  }

  private fetch() {
    this.loading = true;
    this.error = undefined;
    this.grouped = {};
    this.setupStatusesFromTemplate();
    
    // Construir parámetros con validaciones
    const params: any = {};
    
    // Siempre incluir lista_identificador si está disponible
    if (this.list?.identificador) {
      params.lista_identificador = this.list.identificador;
    }
    
    // Incluir espacioTrabajoIdentificador
    const espacioTrabajo = this.espacioTrabajoIdentificador || this.list?.espacioTrabajoIdentificador;
    if (espacioTrabajo) {
      params.espacioTrabajoIdentificador = espacioTrabajo;
    }
    
    // Incluir espacio_identificador
    const espacio = this.espacioIdentificador || this.list?.espacioIdentificador;
    if (espacio) {
      params.espacio_identificador = espacio;
    }
    
    // Incluir carpeta_identificador
    const carpeta = this.carpetaIdentificador || this.list?.carpetaIdentificador;
    if (carpeta) {
      params.carpeta_identificador = carpeta;
    }
    
    console.log('Datos del list:', this.list);
    console.log('Props del componente:', {
      espacioTrabajoIdentificador: this.espacioTrabajoIdentificador,
      espacioIdentificador: this.espacioIdentificador,
      carpetaIdentificador: this.carpetaIdentificador
    });
    console.log('Parámetros finales enviados a searchTasksFiltered:', params);
    
    this.tasks.searchTasksFiltered(params).subscribe({
      next: (items) => {
        console.log('Tareas recibidas en list-view:', items);
        const byStatus: { [k: string]: Task[] } = {};
        const safe = Array.isArray(items) ? items : [];
        console.log('Array seguro de tareas:', safe);
        
        for (const t of safe) {
          const label = (t.estadoLabel || t.estado || 'Sin estado').toString();
          const key = label.toUpperCase();
          console.log(`Procesando tarea ${t.nombre}: estado=${t.estado}, estadoLabel=${t.estadoLabel}, key=${key}`);
          (t as any).estadoLabel = key;
          byStatus[key] = byStatus[key] || [];
          byStatus[key].push(t);
        }
        
        console.log('Tareas agrupadas por estado:', byStatus);
        this.grouped = byStatus;
      },
      error: (e) => {
        console.error('Error cargando tareas:', e);
        this.error = e?.message || 'Error loading tasks';
        this.loading = false;
      },
      complete: () => {
        console.log('Carga de tareas completada. Estado final del grouped:', this.grouped);
        console.log('Total de tareas:', this.getTotalTasksCount());
        this.loading = false;
      }
    });
  }

  private setupStatusesFromTemplate() {
    const listId = this.list?.identificador;
    const tplId = this.templates.getListTemplate(listId);
    const tpl = this.templates.getTemplateById(tplId || undefined);
    if (tpl) {
      this.statuses = tpl.statuses.map(s => ({ key: s.name.toUpperCase(), label: s.name, color: s.color }));
    } else {
      this.statuses = [
        { key: 'OPEN', label: 'OPEN', color: '#9AA0A6' },
        { key: 'PENDING', label: 'PENDING', color: '#FFB020' },
        { key: 'BLOCKED', label: 'BLOCKED', color: '#6A4CFF' },
        { key: 'DONE', label: 'COMPLETADA', color: '#38B87C' },
      ];
    }
  }

  // Métodos para la UI
  getTotalTasksCount(): number {
    return Object.values(this.grouped).reduce((total, tasks) => total + tasks.length, 0);
  }

  getStatusColor(status?: string): string {
    const statusMeta = this.getStatusMeta(status || 'OPEN');
    return statusMeta.color;
  }

  getStatusLabel(status?: string): string {
    const statusMeta = this.getStatusMeta(status || 'OPEN');
    return statusMeta.label;
  }

  getStatusMeta(key?: string) {
    const s = (key || 'OPEN').toString().toUpperCase();
    const found = this.statuses.find(x => x.key === s);
    if (found) return found;
    let color = '#9AA0A6';
    if (/(COMPLET|DONE|CERRAD|TERMINAD)/.test(s)) color = '#38B87C';
    else if (/(PEND)/.test(s)) color = '#FFB020';
    else if (/(BLOCK|BLOQUE)/.test(s)) color = '#6A4CFF';
    else if (/(OPEN|ABIERT)/.test(s)) color = '#9AA0A6';
    return { key: s, label: key || 'OPEN', color };
  }

  assigneeLabel(a: any): string {
    if (!a) return '';
    if (typeof a === 'string') return a;
    return a.nombre || a.username || a.id || '';
  }

  trackById(_i: number, t: Task) { 
    return t.identificador; 
  }

  hasAnyTasks(): boolean {
    return Object.keys(this.grouped).some(k => (this.grouped[k] || []).length > 0);
  }

  getGroupedKeys(): string[] {
    return Object.keys(this.grouped).filter(key => this.grouped[key] && this.grouped[key].length > 0);
  }

  // Método para debugging - mostrar información del estado actual
  getDebugInfo(): any {
    return {
      totalKeys: Object.keys(this.grouped).length,
      keysWithTasks: this.getGroupedKeys(),
      grouped: this.grouped,
      totalTasks: this.getTotalTasksCount()
    };
  }

  getCarpetaName(): string {
    // Aquí puedes obtener el nombre de la carpeta desde tus datos
    // Por ahora retorno "Carpeta" como placeholder
    return this.list?.carpetaNombre || 'Carpeta';
  }

  // Métodos para crear tareas
  startAdd(status: string) {
    this.addingFor = status;
    this.draft = {
      identificador: this.generateTaskId(),
      nombre: '',
      descripcion: '',
      estado: status,
      prioridad: 'Medium',
      listaIdentificador: this.list?.identificador,
      fechaVencimiento: '',
      asignadoA: ''
    };
  }

  cancelAdd() { 
    this.addingFor = null; 
    this.draft = {}; 
  }

  saveAdd() {
    if (!this.addingFor || !this.draft.nombre) return;
    
    this.loading = true;
    this.error = undefined;
    
    // Preparar datos para enviar al backend con la estructura exacta requerida
    const currentUser = this.authService.getCurrentUser();
    const fechaActual = new Date().toISOString().slice(0, 10);
    
    const taskData = {
      identificador: this.draft.identificador || this.generateTaskId(),
      estado: this.draft.estado || 'OPEN',
      progreso: 0,
      nombre: this.draft.nombre,
      fechaInicio: this.draft.fechaVencimiento || fechaActual,
      fechaFin: this.draft.fechaVencimiento || fechaActual,
      duracionHoras: 0,
      tareaPadreIdentificador: '',
      responsableIdentificador: this.draft.asignadoA || '',
      descripcion: this.draft.descripcion || '',
      comentarios: '',
      fechaCreacionTarea: fechaActual,
      fechaCerrada: fechaActual,
      fechaTerminada: fechaActual,
      facturable: false,
      organizacionId: currentUser?.organizacionId || '',
      clienteId: currentUser?.clienteId || '',
      carpeta_identificador: this.carpetaIdentificador || this.list?.carpeta_identificador || '',
      lista_identificador: this.list?.identificador || '',
      tipoTarea: 'TASK',
      etiqueta: '',
      prioridad: this.draft.prioridad || 'Medium'
    };

    console.log('Datos de tarea enviados al backend:', taskData);

    this.tasks.crearTarea(taskData).subscribe({
      next: (response) => {
        console.log('Tarea creada exitosamente:', response);
        this.info = 'Tarea creada exitosamente';
        this.cancelAdd();
        this.fetch(); // Recargar las tareas
        setTimeout(() => this.info = undefined, 3000);
      },
      error: (error) => {
        console.error('Error al crear tarea:', error);
        this.error = 'Error al crear la tarea. Intenta nuevamente.';
        this.loading = false;
        setTimeout(() => this.error = undefined, 5000);
      }
    });
  }

  // Métodos para editar tareas
  startEdit(t: Task) {
    this.editing[t.identificador] = true;
    this.backups[t.identificador] = JSON.parse(JSON.stringify(t));
  }

  cancelEdit(t: Task) {
    const b = this.backups[t.identificador];
    if (b) {
      if ((t.estado || 'OPEN') !== (b.estado || 'OPEN')) {
        this.moveBetweenGroups(t, b.estado || 'OPEN');
      }
      Object.assign(t, b);
      delete this.backups[t.identificador];
    }
    delete this.editing[t.identificador];
  }

  saveEdit(t: Task) {
    // TODO: Implementar llamada al servicio para actualizar tarea
    delete this.backups[t.identificador];
    delete this.editing[t.identificador];
    this.info = 'Tarea actualizada (solo local por ahora)';
    setTimeout(() => this.info = undefined, 3000);
  }

  deleteTask(t: Task) {
    if (confirm(`¿Estás seguro de que quieres eliminar la tarea "${t.nombre}"?`)) {
      // TODO: Implementar llamada al servicio para eliminar tarea
      const status = (t.estado || 'OPEN').toUpperCase();
      if (this.grouped[status]) {
        this.grouped[status] = this.grouped[status].filter(task => task.identificador !== t.identificador);
      }
      this.info = 'Tarea eliminada (solo local por ahora)';
      setTimeout(() => this.info = undefined, 3000);
    }
  }

  onStatusChange(t: Task, newStatus: string) {
    const current = (t as any).estadoLabel || t.estado || 'OPEN';
    if (current === newStatus) return;
    this.moveBetweenGroups(t, newStatus);
  }

  private moveBetweenGroups(t: Task, newStatus: string) {
    const old = ((t as any).estadoLabel || t.estado || 'OPEN').toUpperCase();
    const ns = (newStatus || 'OPEN').toUpperCase();
    if (!this.grouped[old]) return;
    this.grouped[old] = this.grouped[old].filter(x => x.identificador !== t.identificador);
    this.ensureGroup(ns);
    (t as any).estadoLabel = ns;
    this.grouped[ns].unshift(t);
  }

  private ensureGroup(k: string) { 
    this.grouped[k] = this.grouped[k] || []; 
  }

  private generateTaskId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `task_${timestamp}_${random}`;
  }
}
