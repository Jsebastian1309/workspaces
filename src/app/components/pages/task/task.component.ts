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
  statuses: { key: string; label: string; color: string }[] = [];
  teams: { identificador: string; nombres: string }[] = [];
  filterCategory: string = '';
  filterStartDate: string = ''; // YYYY-MM-DD
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
        next: (items) => { this.tasks = Array.isArray(items) ? items : []; },
        error: (e) => { this.error = e?.message; }
      });
  }

  private loadStatuses() {
    const templateStatusId = this.extractTemplateEstadoIdentificador(this.list);
    this.templateStatusDetailService.listTemplateStatusDetails(templateStatusId).subscribe({
      next: (details) => {
        const arr = Array.isArray(details) ? details : [];
        this.statuses = arr
          .sort((a, b) => (a.secuencia ?? 0) - (b.secuencia ?? 0))
          .map(detail => ({ key: String(detail.nombre || '').toUpperCase(), label: detail.nombre, color: detail.color }));
      },
    });
  }

  private extractTemplateEstadoIdentificador(list: any): string | undefined {
    if (!list) return undefined;
    const direct = list.templateEstadoIdentificador
      || list.template_estado_identificador
      || list.estadoTemplateIdentificador
      || list.templateEstadoId
      || (list.templateEstado && list.templateEstado.identificador);
    if (direct) return direct;
    const raw = list.raw || list.data || list.lista || {};
    return raw.templateEstadoIdentificador
      || raw.template_estado_identificador
      || raw.estadoTemplateIdentificador
      || raw.templateEstadoId
      || (raw.templateEstado && raw.templateEstado.identificador);
  }

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
    // Obtener el nombre de la carpeta desde los datos
    return this.list?.carpetaNombre || 'Carpeta';
  }

  getEspacioTrabajoName(): string {
    return this.list?.espacioTrabajoNombre || 'Workspace';
  }

  getEspacioName(): string {
    return this.list?.espacioNombre || 'Space';
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
}
