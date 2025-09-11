import { Component, Input, OnInit, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ListViewComponent } from '../../views/list-view/list-view.component';
import { TaskService } from 'src/app/service/features/task/Task.service';
import { Task } from 'src/app/models/task.model';
import { TemplateStatusDetailService } from 'src/app/service/features/template/status/template-statusdetail.service';
import { TeamService } from 'src/app/service/features/team/team.service';

export type ViewType = 'board' | 'list' | 'gantt' | 'calendar' ;
@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, OnChanges {
  @Input() list: any;
  @Input() espacioTrabajoIdentificador?: string;
  @Input() espacioIdentificador?: string;
  @Input() carpetaIdentificador?: string;
  @ViewChild(ListViewComponent) listViewComponent?: ListViewComponent;
  currentView: ViewType = 'list';
  loading = false;
  error?: string;
  tasks: Task[] = [];
  statuses: { id?: string; key: string; label: string; color: string }[] = [];
  teams: { identificador: string; nombres: string }[] = [];
  filterCategory: string = '';
  filterStartDate: string = ''; 
  filterEndDate: string = '';
  filterPriority: string = '';
  filterStatus: string = '';
  filterAssignee: string = '';

  viewOptions = [
    { key: 'board' as ViewType, label: 'Board', icon: '📋' },
    { key: 'list' as ViewType, label: 'List', icon: '�' },
    { key: 'gantt' as ViewType, label: 'Gantt', icon: '�' },
    { key: 'calendar' as ViewType, label: 'Calendar', icon: '📅' }
  ];

  constructor(
    private taskService: TaskService,
    private templateStatusDetailService: TemplateStatusDetailService,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
  this.loadStatuses();
  this.loadTeams();
  this.fetchTasks();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['list'] || changes['espacioTrabajoIdentificador'] || changes['espacioIdentificador'] || changes['carpetaIdentificador']) {
  this.loadStatuses();
  this.loadTeams();
      this.fetchTasks();
    }
  }

  fetchTasks() {
    if (!this.list?.identificador) { this.tasks = []; return; }
    this.loading = true;
    this.error = undefined;
    const params: any = {
      espacioTrabajoIdentificador: this.espacioTrabajoIdentificador,
      listaIdentificador: this.list.identificador,
      espacioIdentificador: this.espacioIdentificador,
      carpetaIdentificador: this.carpetaIdentificador,
      categoria: this.filterCategory,
      prioridad: this.filterPriority,
      estado: this.filterStatus,
      responsableIdentificador: this.filterAssignee,
      fechaInicio: this.filterStartDate,
      fechaFin: this.filterEndDate,
    };
    Object.keys(params).forEach(k => (params[k] === undefined || params[k] === null || params[k] === '') && delete params[k]);
    this.taskService.searchTasksFiltered(params)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (items) => {
          this.tasks = Array.isArray(items) ? items : [];
          if (!this.statuses || this.statuses.length === 0) {
            this.statuses = this.deriveStatusesFromTasks(this.tasks);
          }
        },
        error: (e) => { this.error = e?.message; }
      });
  }

  private loadStatuses() {
    const templateStatusId = this.list?.templateEstadoIdentificador;
    if (templateStatusId) {
      this.fetchStatusDetails(templateStatusId);
    } else {
      // Derivar de tareas cuando no hay template
      this.statuses = this.deriveStatusesFromTasks(this.tasks);
    }
  }

  private fetchStatusDetails(templateStatusId: string) {
    if (!templateStatusId) { this.statuses = []; return; }
    this.templateStatusDetailService.listTemplateStatusDetails(templateStatusId).subscribe({
      next: (details) => {
        const arr = Array.isArray(details) ? details : [];
        this.statuses = arr
          .sort((a, b) => (a.secuencia ?? 0) - (b.secuencia ?? 0))
          .map(detail => ({ id: detail.identificador, key: String(detail.nombre || '').toUpperCase(), label: detail.nombre, color: detail.color }));
      },
      error: () => { this.statuses = []; }
    });
  }

  private deriveStatusesFromTasks(tasks: Task[]): { id?: string; key: string; label: string; color: string }[] {
    const map = new Map<string, { key: string; label: string; color: string }>();
    (tasks || []).forEach(t => {
      const label = (t as any)?.estado || '';
      if (!label) return;
      const key = String(label).toUpperCase();
      if (!map.has(key)) {
        map.set(key, { key, label: String(label), color: '#6c757d' });
      }
    });
    return Array.from(map.values());
  }

  // Eliminadas resoluciones alternativas; se usa solo templateEstadoIdentificador cuando exista

  private loadTeams() {
    this.teamService.listTeam().subscribe({
      next: (res) => {
        this.teams = (res || []).map((t: any) => ({ identificador: t.identificador, nombres: t.nombres }));
      },
      error: () => { this.teams = []; }
    });
  }

  switchView(view: ViewType): void {
    this.currentView = view;
  }

  getCarpetaName(): string {
    return this.list?.carpetaNombre;
  }

  getEspacioTrabajoName(): string {
    return this.list?.espacioTrabajoNombre;
  }

  getEspacioName(): string {
    return this.list?.espacioNombre;
  }

  addNewTask(): void {
    if (this.currentView === 'list' && this.listViewComponent) {
      const first = this.statuses && this.statuses[0]?.key ? this.statuses[0].key : 'OPEN';
    this.listViewComponent.startAdd(first);
    } else {
      this.currentView = 'list';
      setTimeout(() => {
        if (this.listViewComponent) {
      const first = this.statuses && this.statuses[0]?.key ? this.statuses[0].key : 'OPEN';
      this.listViewComponent.startAdd(first);
        }
      }, 100);
    }
  }

  clearFilters() {
    this.filterCategory = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterPriority = '';
    this.filterStatus = '';
    this.filterAssignee = '';
    this.fetchTasks();
  }

  getWorkspaceIcon(): string {
    const icon = (this.list as any)?.espacioTrabajoIcono;
    return typeof icon === 'string' ? icon : '';
  }
  getSpaceIcon(): string {
    const icon = (this.list as any)?.espacioIcono;
    return typeof icon === 'string' ? icon : '';
  }
  getFolderIcon(): string {
    const icon = (this.list as any)?.carpetaIcono;
    return typeof icon === 'string' ? icon : '';
  }
  getListIcon(): string {
    const icon = (this.list as any)?.listaIcono;
    return typeof icon === 'string' ? icon : '';
  }

  getPriorityColor(): string {
    const val = (this.filterPriority).toLowerCase();
    if (!val) return '#9aa0a6';
    if (val === 'urgente') return '#e53935'; 
    if (val === 'alta') return '#f6c343';
    if (val === 'normal') return '#4f75ff';
    if (val === 'baja') return '#9e9e9e';
    return '#9aa0a6';
  }

  getSelectedStatusColor(): string {
    const label = this.filterStatus || '';
    if (!label) return '#9aa0a6';
    const found = (this.statuses || []).find(s => (s.label || '').toLowerCase() === label.toLowerCase());
    return found?.color || '#9aa0a6';
  }


  getPriorityLabel(): string {
    const val = (this.filterPriority || '').toLowerCase();
    if (!val) return 'All';
    if (val === 'urgente') return 'Urgent';
    if (val === 'alta') return 'High';
    if (val === 'normal') return 'Normal';
    if (val === 'baja') return 'Low';
    return this.filterPriority;
  }
  setPriority(v: string) { this.filterPriority = v; }
  isPriority(v: string) { return (this.filterPriority || '').toLowerCase() === v.toLowerCase(); }

  // Status helpers for custom dropdown
  getSelectedStatusLabel(): string {
    const label = this.filterStatus || '';
    if (!label) return 'All';
    return label;
  }
  setStatus(v: string) { this.filterStatus = v; }
  isStatus(v: string) { return (this.filterStatus || '').toLowerCase() === (v || '').toLowerCase(); }

  // Assignee helpers for custom dropdown
  getAssigneeIcon(): string {
    // Group icon when 'All' (no filter); person icon when a specific assignee is selected
    return this.filterAssignee ? 'bi bi-person' : 'bi bi-people';
  }
  getAssigneeLabel(): string {
    if (!this.filterAssignee) return 'All';
    const found = (this.teams || []).find(t => t.identificador === this.filterAssignee);
    return found?.nombres || 'All';
  }
  setAssignee(v: string) { this.filterAssignee = v; }
}
