import { Component, Input, OnChanges, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { TaskService } from 'src/app/service/features/task/task.service';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { TeamService } from 'src/app/service/features/team/team.service';
import { Task } from 'src/app/models/task.model';
import { TemplatesService } from 'src/app/service/features/templates/Templates.service';
import { TemplateTaskService } from 'src/app/service/features/templates/task/template-task.service';
import { TemplateTaskdetailService } from 'src/app/service/features/templates/task/template-taskdetail.service';

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
  draft: Partial<Task> = {};
  editing: Record<string, boolean> = {};
  backups: Record<string, Task> = {};
  priorities = ['Low', 'Medium', 'High'];
  teams: { identificador: string; nombres: string }[] = [];

    // Template integration
  templates: any[] = [];
  selectedTemplate: any = null;
  showTemplateSelector = false;

  constructor(
    private taskService: TaskService,
    private templatesService: TemplatesService,
    private templateTaskService: TemplateTaskService,
    private templateTaskdetailService: TemplateTaskdetailService,
    private authService: AuthService,
    private teamService: TeamService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks'] || changes['list']) {
      this.groupTasksFromInput();
      this.setupStatusesFromTemplate();
    }
  }

  private loadTeams(): void {
    this.teamService.listTeam().subscribe({
      next: (res) => {
        this.teams = res.map((team) => ({
          identificador: team.identificador,
          nombres: team.nombres,
        }));
      },
      error: (err) => {
        console.error('Error al cargar equipos:', err);
      },
    });
  }

  private groupTasksFromInput() {
    this.loading = false;
    this.error = undefined;
    const byStatus: { [k: string]: Task[] } = {};
    const safe = Array.isArray(this.tasks) ? this.tasks : [];

    // Filtrar tareas por espacio de trabajo y lista
    const filteredTasks = safe.filter((t) => {
      return (
        t.espacioTrabajoIdentificador === this.espacioTrabajoIdentificador &&
        t.listaIdentificador === this.list?.identificador
      );
    });

    for (const t of filteredTasks) {
      const label = (t.estado || t.estadoLabel || 'OPEN').toString().toUpperCase();
      (t as any).estadoLabel = label;
      byStatus[label] = byStatus[label] || [];
      byStatus[label].push(t);
    }
    this.grouped = byStatus;
  }

  private setupStatusesFromTemplate() {
    const listId = this.list?.identificador;
    const tplId = this.templatesService.getListTemplate(listId);
    const tpl = this.templatesService.getTemplateById(tplId || undefined);
    if (tpl) {
      this.statuses = tpl.statuses.map(s => ({ key: s.name.toUpperCase(), label: s.name, color: s.color }));
    } else {
      this.statuses = [
        { key: 'OPEN', label: 'OPEN', color: '#9AA0A6' },
        { key: 'PENDING', label: 'PENDING', color: '#FFB020' },
        { key: 'BLOCKED', label: 'BLOCKED', color: '#6A4CFF' },
        { key: 'DONE', label: 'COMPLETADA', color: '#38B87C' },
        { key: 'LIKE', label: 'LIKE', color: '#9f851eff' },
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
    const folderIdentificador =this.carpetaIdentificador;
    console.log("WOG",folderIdentificador)
    const taskData = {
      identificador: this.draft.identificador || this.generateTaskId(),
      estado: this.draft.estado || 'OPEN',
      progreso: 0,
      nombre: this.draft.nombre,
      fechaInicio: this.draft.fechaVencimiento || fechaActual,
      fechaFin: this.draft.fechaVencimiento || fechaActual,
      duracionHoras: 0,

      responsableIdentificador: this.draft.asignadoA || '',
      descripcion: this.draft.descripcion || '',
      comentarios: '',
      fechaCreacionTarea: fechaActual,
      fechaCerrada: fechaActual,
      fechaTerminada: fechaActual,
      facturable: false,
      organizacionId: currentUser?.organizacionId || '',
      clienteId: currentUser?.clienteId || '',
      carpetaIdentificador: folderIdentificador,
      listaIdentificador: this.list.identificador,
      tipoTarea: 'TASK',
      etiqueta: 'sda',
      prioridad: this.draft.prioridad || 'Medium'
    };

    console.log('Datos de tarea enviados al backend:', taskData);

  // this.taskService.crearTarea(taskData).subscribe({
  //     next: (response) => {
  //       console.log('Tarea creada exitosamente:', response);
  //       this.info = 'Tarea creada exitosamente';
  //       this.cancelAdd();
  //   this.refresh.emit(); // Pedir al padre que recargue tareas
  //       setTimeout(() => this.info = undefined, 3000);
  //     },
  //     error: (error) => {
  //       console.error('Error al crear tarea:', error);
  //       this.error = 'Error al crear la tarea. Intenta nuevamente.';
  //       this.loading = false;
  //       setTimeout(() => this.error = undefined, 5000);
  //     }
  //   });
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

    // Preparar datos para enviar al backend con la estructura exacta requerida
    const updatedTask = {
      identificador: t.identificador,
      nombre: t.nombre,
      descripcion: t.descripcion,
      estado: t.estado,
      prioridad: t.prioridad,
      fechaVencimiento: t.fechaVencimiento,
      asignadoA: t.asignadoA,
      listaIdentificador: t.listaIdentificador,
      espacioTrabajoIdentificador: t.espacioTrabajoIdentificador,
    };

    this.taskService.actualizarTarea(updatedTask).subscribe({
      next: () => {
        this.info = 'Tarea actualizada exitosamente';
        delete this.editing[t.identificador];
        setTimeout(() => (this.info = undefined), 3000);
      },
      error: (err) => {
        console.error('Error al actualizar tarea:', err);
        this.error = 'Error al actualizar la tarea. Intenta nuevamente.';
        setTimeout(() => (this.error = undefined), 5000);
      },
      complete: () => {
        this.loading = false;
      },
    });
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

   // Template methods
  loadTemplates(): void {
    this.templateTaskService.listTemplateTasks().subscribe({
      next: (data) => {
        this.templates = data;
      },
      error: (err) => {
        this.error = 'Error loading templates';
      }
    });
  }

  toggleTemplateSelector(): void {
    this.showTemplateSelector = !this.showTemplateSelector;
    if (this.showTemplateSelector && this.templates.length === 0) {
      this.loadTemplates();
    }
  }

  selectTemplate(template: any): void {
    this.selectedTemplate = template;
    this.applyTemplate(template.identificador);
  }

  applyTemplate(templateId: string): void {
    this.loading = true;
    this.templateTaskdetailService.listTemplateTaskDetails(templateId).subscribe({
      next: (details) => {
        const newTasks = details.map(detail => ({
          nombre: detail.nombre,
          descripcion: detail.descripcion,
          estado: detail.estado,
          prioridad: detail.prioridad,
          fechaInicio: null,
          fechaFin: null,
          fechaVencimiento: null,
          duracionHoras: null,
          asignadoA: null,
          // Add other required fields as needed
        }));
        // Add new tasks to the list (assuming you have a way to create them via TaskService)
        newTasks.forEach(task => {
          this.taskService.Createtask(task).subscribe({
            next: (createdTask) => {
              this.tasks.push(createdTask);
              this.groupTasksFromInput();
            },
            error: (err) => {
              this.error = 'Error creating task from template';
            }
          });
        });
        this.loading = false;
        this.info = 'Template applied successfully';
        this.showTemplateSelector = false;
      },
      error: (err) => {
        this.error = 'Error loading template details';
        this.loading = false;
      }
    });
  }

}
