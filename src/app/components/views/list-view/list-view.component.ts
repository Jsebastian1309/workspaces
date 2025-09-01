import { Component, Input, OnChanges, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { TaskService } from 'src/app/service/features/task/Task.service';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { TeamService } from 'src/app/service/features/team/team.service';
import { Task } from 'src/app/models/task.model';
import { TemplateStatusDetailService } from 'src/app/service/features/template/status/template-statusdetail.service';
import { TemplateTaskService } from 'src/app/service/features/template/task/template-task.service';
import { ListService } from 'src/app/service/features/list/list.service';

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
  @Input() tasks: Task[] = [];
  @Output() refresh = new EventEmitter<void>();

  loading = false;
  error?: string;
  info?: string;
  grouped: { [status: string]: Task[] } = {};

  statuses: { key: string; label: string; color: string }[] = [];

  // UI state for inline create/edit
  addingFor: string | null = null;
  draft: any = {};
  editing: Record<string, boolean> = {};
  backups: Record<string, Task> = {};
  priorities = ['Low', 'Medium', 'High'];
  teams: { identificador: string; nombres: string }[] = [];

  // Template de estados (backend)
  private loadingStatuses = false;

  // Task Templates (apply to create tasks)
  templates: any[] = [];
  selectedTemplate: any = null;
  showTemplateSelector = false;

  // Collapse state per status key
  private collapsed: Record<string, boolean> = {};

  constructor(
  private taskService: TaskService,
  private templateStatusDetailService: TemplateStatusDetailService,
    private templateTaskService: TemplateTaskService,
  private listService: ListService,
    private authService: AuthService,
    private teamService: TeamService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks'] || changes['list']) {
      this.groupTasksFromInput();
      this.loadStatusesFromBackend();
      // Si ya hay estados cargados, conciliar grupos para asegurar visibilidad
      if (this.statuses && this.statuses.length > 0) {
        this.reconcileGroupsWithStatuses();
      }
      if (!this.teams || this.teams.length === 0) {
        this.loadTeams();
      }
    }
  }

  // Compute only statuses that currently have tasks (or the one being added)
  getVisibleStatuses(): { key: string; label: string; color: string }[] {
    const statusList = this.statuses || [];
    return statusList.filter(
      (s) => (this.grouped[s.key] || []).length > 0 || this.addingFor === s.key
    );
  }

  // --- Task Template integration ---
  loadTemplates(): void {
    this.templateTaskService.listTemplateTasks().subscribe({
      next: (data) => { this.templates = Array.isArray(data) ? data : []; },
      error: () => { this.error = 'Error loading templates'; }
    });
  }

  toggleTemplateSelector(): void {
    this.showTemplateSelector = !this.showTemplateSelector;
    if (this.showTemplateSelector && this.templates.length === 0) {
      this.loadTemplates();
    }
  }

  selectTemplate(templateId: string): void {
    if (!templateId) return;
    this.loading = true;
    this.error = undefined;
    const found = this.templates.find(t => t.identificador === templateId);
    if (found) {
      this.selectedTemplate = found;
      if (!this.list?.identificador) {
        this.loading = false;
        this.error = 'Lista no válida para aplicar template';
        return;
      }
      this.listService.applyTemplateToList(this.list.identificador, templateId)
        .pipe(finalize(() => { this.loading = false; this.showTemplateSelector = false; }))
        .subscribe({
        next: (textMsg: string) => {
          this.info = textMsg || 'Template aplicado';
          this.refresh.emit();
          // Intento adicional tras breve espera por consistencia eventual
          setTimeout(() => this.refresh.emit(), 500);
          setTimeout(() => { this.info = undefined; }, 4000);
        },
        error: (err: any) => {
          console.error('Error aplicando template a la lista', err);
          this.error = 'No se pudo aplicar el template a la lista';
          setTimeout(() => { this.error = undefined; }, 4000);
        }
      });
    } else {
      this.loading = false;
      this.error = 'Template no encontrado';
    }
  }

  private getFirstStatusKey(): string {
    if (this.statuses && this.statuses.length > 0) {
      return this.statuses[0].key;
    }
    return 'OPEN';
  }

  private loadTeams(): void {
    this.teamService.listTeam().subscribe({
      next: (res) => {
        this.teams = res.map((team) => ({
          identificador: team.identificador,
          nombres: team.nombres,
        }));
      },
  error: (err: any) => {
        console.error('Error al cargar equipos:', err);
      },
    });
  }

  private groupTasksFromInput() {
    this.loading = false;
    this.error = undefined;
    const byStatus: { [k: string]: Task[] } = {};
    const safe = Array.isArray(this.tasks) ? this.tasks : [];

    // Filtrar tareas: prioriza coincidencia por lista; el espacio de trabajo es opcional
    const filteredTasks = safe.filter((t) => {
      const matchesList = t.listaIdentificador === this.list?.identificador;
      if (matchesList) return true;
      const matchesWorkspace = this.espacioTrabajoIdentificador
        ? t.espacioTrabajoIdentificador === this.espacioTrabajoIdentificador
        : true;
      // Si no hay lista seleccionada aún, permite por espacio de trabajo
      return matchesWorkspace && !this.list?.identificador;
    });

    for (const t of filteredTasks) {
      const raw = (t as any).estado;
      let label: string;
      if (raw && String(raw).trim() !== '') {
        label = String(raw).toUpperCase();
      } else {
        // Marcar tareas sin estado para moverlas luego al primer estado del template
        (t as any).__noEstado = true;
        label = '__NO_STATUS__';
      }
      (t as any).estadoLabel = label;
      // Normalizar asignado: si viene responsableIdentificador pero no asignadoA, usarlo para UI
      if (!(t as any).asignadoA && (t as any).responsableIdentificador) {
        (t as any).asignadoA = (t as any).responsableIdentificador;
      }
      byStatus[label] = byStatus[label] || [];
      byStatus[label].push(t);
    }
    this.grouped = byStatus;
  }

  private loadStatusesFromBackend() {
    const templateStatusId = this.list?.templateEstadoIdentificador;
    this.templateStatusDetailService.listTemplateStatusDetails(templateStatusId).subscribe({
      next: (details) => {
        const arr = Array.isArray(details) ? details : [];
  this.statuses = arr
          .sort((a, b) => (a.secuencia ?? 0) - (b.secuencia ?? 0))
          .map(d => ({ key: String(d.nombre || '').toUpperCase(), label: d.nombre, color: d.color || '#9AA0A6' }));
  // Asegurar que las tareas se muestren en el primer estado si su estado no pertenece al template
  this.reconcileGroupsWithStatuses();
  // Inicializar estado de colapso (abierto por defecto)
  for (const s of this.statuses) {
    if (this.collapsed[s.key] === undefined) this.collapsed[s.key] = false;
  }
      },
  error: (e: any) => {
        console.error('Error cargando estados del template', e);
        this.statuses = [
          { key: 'OPEN', label: 'OPEN', color: '#9AA0A6' },
          { key: 'PENDING', label: 'PENDING', color: '#FFB020' },
          { key: 'BLOCKED', label: 'BLOCKED', color: '#6A4CFF' },
          { key: 'DONE', label: 'COMPLETADA', color: '#38B87C' },
        ];
  },
      complete: () => { this.loadingStatuses = false; }
    });
  }

  // Mueve únicamente tareas SIN estado al primer estado del template; conserva las que sí tienen estado
  private reconcileGroupsWithStatuses(): void {
    if (!this.statuses || this.statuses.length === 0) return;
    const firstKey = this.getFirstStatusKey();
    const valid = new Set(this.statuses.map(s => s.key));
    const newGrouped: { [k: string]: Task[] } = {};

    // Inicializa todos los grupos del template vacíos
    for (const s of this.statuses) {
      newGrouped[s.key] = [];
    }

    // Reubicar tareas: las sin estado o con estado no válido al primer estado; las válidas se mantienen
    const entries = Object.entries(this.grouped || {});
    for (const [key, arr] of entries) {
      for (const t of arr || []) {
        const k = (t as any).__noEstado ? '__NO_STATUS__' : String((t as any).estadoLabel || (t as any).estado || '').toUpperCase();
        const target = valid.has(k) ? k : firstKey;
        (t as any).estadoLabel = target;
        newGrouped[target].push(t);
      }
    }

    this.grouped = newGrouped;
  }

  // Métodos para la UI
  getTotalTasksCount(): number {
    return Object.values(this.grouped).reduce((total, tasks) => total + tasks.length, 0);
  }

  getStatusColor(status?: string): string {
  const statusMeta = this.getStatusMeta(status);
    return statusMeta.color;
  }

  getStatusLabel(status?: string): string {
  const statusMeta = this.getStatusMeta(status);
    return statusMeta.label;
  }

  getStatusMeta(key?: string) {
  const defaultKey = this.getFirstStatusKey();
  const s = (key || defaultKey).toString().toUpperCase();
  const found = (this.statuses || []).find(x => x.key === s);
    if (found) return found;
    let color = '#9AA0A6';
    if (/(COMPLET|DONE|CERRAD|TERMINAD)/.test(s)) color = '#38B87C';
    else if (/(PEND)/.test(s)) color = '#FFB020';
    else if (/(BLOCK|BLOQUE)/.test(s)) color = '#6A4CFF';
  else if (/(OPEN|ABIERT)/.test(s)) color = '#9AA0A6';
  return { key: s, label: key || defaultKey, color };
  }

  assigneeLabel(a: any): string {
    if (!a) return '';
    // Si es un ID, buscar en teams
    if (typeof a === 'string') {
      const found = this.teams?.find(t => t.identificador === a);
      return found?.nombres || a;
    }
    // Si es objeto, intentar por identificador/nombres, y respaldo por username
    const id = a.identificador || a.id;
    if (id) {
      const found = this.teams?.find(t => t.identificador === id);
      if (found?.nombres) return found.nombres;
    }
    return a.nombres || a.nombre || a.username || id || '';
  }

  trackById(_i: number, t: Task) { 
    return t.identificador; 
  }

  hasAnyTasks(): boolean {
    return Object.keys(this.grouped).some(k => (this.grouped[k] || []).length > 0);
  }

  getGroupedKeys(): string[] {
    return Object.keys(this.grouped);
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
    const currentUser = this.authService.getCurrentUser();
    const today = new Date().toISOString().slice(0, 10);
    this.draft = {
      identificador: this.generateTaskId(),
      nombre: '',
      descripcion: '',
      estado: status,
      progreso: 0,
      prioridad: 'Medium',
      fechaInicio: today,
      fechaFin: today,
      fechaVencimiento: '',
      duracionHoras: 0,
      comentarios: '',
      fechaCreacionTarea: today,
      fechaCerrada: '',
      fechaTerminada: '',
      facturable: false,
      tipoTarea: 'TASK',
      etiqueta: 'sda',
      organizacionId: currentUser?.organizacionId || '',
      clienteId: currentUser?.clienteId || '',
      carpetaIdentificador: this.carpetaIdentificador,
      listaIdentificador: this.list?.identificador,
      asignadoA: ''
    };
    if (!this.teams || this.teams.length === 0) {
      this.loadTeams();
    }
  }

  cancelAdd() { 
    this.addingFor = null; 
    this.draft = {}; 
  }

  onAssigneeChange(ev: Event) {
    const target = ev.target as HTMLSelectElement;
    this.draft.asignadoA = target?.value || '';
  }

  saveAdd() {
    this.loading = true;
    this.error = undefined;
    const currentUser = this.authService.getCurrentUser();
    const fechaActual = new Date().toISOString().slice(0, 10);
    const folderIdentificador = this.carpetaIdentificador;
    console.log("WOG",folderIdentificador)
  const responsibleId = this.draft.asignadoA || '';
    const taskData = {
      identificador: this.draft.identificador || this.generateTaskId(),
      estado: this.draft.estado,
      progreso: Number(this.draft.progreso) ?? 0,
      nombre: this.draft.nombre,
      fechaInicio: this.draft.fechaInicio || this.draft.fechaVencimiento || fechaActual,
      fechaFin: this.draft.fechaFin || this.draft.fechaVencimiento || fechaActual,
      duracionHoras: Number(this.draft.duracionHoras) ?? 0,
  responsableIdentificador: responsibleId,
  asignadoA: responsibleId,
      descripcion: this.draft.descripcion,
      comentarios: this.draft.comentarios || '',
      fechaCreacionTarea: this.draft.fechaCreacionTarea || fechaActual,
      fechaCerrada: this.draft.fechaCerrada || '',
      fechaTerminada: this.draft.fechaTerminada || '',
      facturable: !!this.draft.facturable,
      organizacionId: currentUser?.organizacionId || this.draft.organizacionId || '',
      clienteId: currentUser?.clienteId || this.draft.clienteId || '',
      carpetaIdentificador: folderIdentificador || this.draft.carpetaIdentificador,
      listaIdentificador: this.list.identificador,
  tipoTarea: this.draft.tipoTarea || 'TASK',
      etiqueta: this.draft.etiqueta || 'sda',
      prioridad: this.draft.prioridad || 'Medium'
    };

    console.log('Datos de tarea enviados al backend:', taskData);

  this.taskService.Createtask(taskData).subscribe({
      next: (response) => {
        console.log('Tarea creada exitosamente:', response);
        this.info = 'Tarea creada exitosamente';
        this.cancelAdd();
    this.refresh.emit(); // Pedir al padre que recargue tareas
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
    this.loading = true;
    this.error = undefined;
  // Optimistic exit from edit mode
  const editId = (t as any).identificador;
  const backup = this.backups[editId] ? JSON.parse(JSON.stringify(this.backups[editId])) : null;
  this.editing[editId] = false;

    // Preparar datos para enviar al backend con la estructura exacta requerida
    const responsibleId = (t as any).asignadoA || (t as any).responsableIdentificador || '';
    const updatedTask: any = {
      identificador: (t as any).identificador,
      nombre: (t as any).nombre,
      descripcion: (t as any).descripcion,
      comentarios: (t as any).comentarios,
      estado: (t as any).estado,
      progreso: Number((t as any).progreso) ?? 0,
      prioridad: (t as any).prioridad,
      fechaInicio: (t as any).fechaInicio,
      fechaFin: (t as any).fechaFin,
      fechaVencimiento: (t as any).fechaVencimiento,
      fechaCreacionTarea: (t as any).fechaCreacionTarea,
      fechaCerrada: (t as any).fechaCerrada,
      fechaTerminada: (t as any).fechaTerminada,
      duracionHoras: Number((t as any).duracionHoras) ?? 0,
      facturable: !!(t as any).facturable,
      responsableIdentificador: responsibleId,
      asignadoA: responsibleId, // mantener en UI
      etiqueta: (t as any).etiqueta,
      tipoTarea: (t as any).tipoTarea || 'TASK',
      organizacionId: (t as any).organizacionId,
      clienteId: (t as any).clienteId,
      carpetaIdentificador: (t as any).carpetaIdentificador,
      listaIdentificador: (t as any).listaIdentificador,
      espacioTrabajoIdentificador: (t as any).espacioTrabajoIdentificador,
    };

    this.taskService.actualizarTarea(updatedTask).subscribe({
      next: () => {
        this.info = 'Tarea actualizada exitosamente';
        delete this.editing[t.identificador];
        if (this.backups[t.identificador]) {
          delete this.backups[t.identificador];
        }
        // pedir al padre que recargue la data
        this.refresh.emit();
        setTimeout(() => (this.info = undefined), 3000);
      },
  error: (err: any) => {
        console.error('Error al actualizar tarea:', err);
        this.error = 'Error al actualizar la tarea. Intenta nuevamente.';
        // Restore edit mode and previous values on error
        if (backup) {
          Object.assign(t as any, backup);
          this.backups[editId] = backup;
        }
        this.editing[editId] = true;
        setTimeout(() => (this.error = undefined), 5000);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  deleteTask(t: Task) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la tarea "${t.nombre}"?`)) return;
    this.loading = true;
    this.error = undefined;
    const payload = { identificador: t.identificador };
    const svc: any = this.taskService as any;
    const del$ = svc.eliminarTarea ? svc.eliminarTarea(payload) : null;
    if (!del$ || !del$.subscribe) {
      // fallback local removal
  const status = (((t as any).estadoLabel) || t.estado || this.getFirstStatusKey()).toString().toUpperCase();
      if (this.grouped[status]) {
        this.grouped[status] = this.grouped[status].filter(task => task.identificador !== t.identificador);
      }
      this.loading = false;
      this.info = 'Tarea eliminada localmente';
      setTimeout(() => this.info = undefined, 3000);
      return;
    }
    del$.subscribe({
      next: () => {
  const status = (((t as any).estadoLabel) || t.estado || this.getFirstStatusKey()).toString().toUpperCase();
        if (this.grouped[status]) {
          this.grouped[status] = this.grouped[status].filter(task => task.identificador !== t.identificador);
        }
        this.info = 'Tarea eliminada exitosamente';
        setTimeout(() => this.info = undefined, 3000);
        this.refresh.emit();
      },
      error: (err: any) => {
        console.error('Error al eliminar tarea', err);
        this.error = 'Error al eliminar la tarea';
        setTimeout(() => this.error = undefined, 4000);
      },
      complete: () => { this.loading = false; }
    });
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
  (t as any).estado = ns;
    this.grouped[ns].unshift(t);
  }

  private ensureGroup(k: string) { 
    this.grouped[k] = this.grouped[k] || []; 
  }

  // Collapse helpers
  isCollapsed(key: string): boolean {
    return !!this.collapsed[key];
  }
  toggleCollapse(key: string): void {
    this.collapsed[key] = !this.isCollapsed(key);
  }

  private generateTaskId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `task_${timestamp}_${random}`;
  }

   // Template methods
  // Removed local template application; statuses come from backend template association
// gga
// adsad
}
