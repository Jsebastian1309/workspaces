import { Component, Input, OnInit, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { ListViewComponent } from '../../views/list-view/list-view.component';
import { TaskService } from 'src/app/service/features/task/task.service';
import { Task } from 'src/app/models/task.model';

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
  filterCategory: string = '';
  filterStartDate: string = ''; // YYYY-MM-DD
  filterEndDate: string = '';
  filterPriority: string = '';
  filterStatus: string = '';

  viewOptions = [
    { key: 'board' as ViewType, label: 'Board', icon: '📋' },
    { key: 'list' as ViewType, label: 'List', icon: '�' },
    { key: 'gantt' as ViewType, label: 'Gantt', icon: '�' },
    { key: 'calendar' as ViewType, label: 'Calendar', icon: '📅' }
  ];

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.fetchTasks();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['list'] || changes['espacioTrabajoIdentificador'] || changes['espacioIdentificador'] || changes['carpetaIdentificador']) {
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
      fechaInicio: this.filterStartDate,
      fechaFin: this.filterEndDate,
    };
    Object.keys(params).forEach(k => (params[k] === undefined || params[k] === null || params[k] === '') && delete params[k]);
    this.taskService.searchTasksFiltered(params).subscribe({
      next: (items) => { this.tasks = Array.isArray(items) ? items : []; },
      error: (e) => { this.error = e?.message; this.loading = false; },
      complete: () => { this.loading = false; }
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
      this.listViewComponent.startAdd('OPEN');
    } else {
      this.currentView = 'list';
      setTimeout(() => {
        if (this.listViewComponent) {
          this.listViewComponent.startAdd('OPEN');
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
    this.fetchTasks();
  }
}
