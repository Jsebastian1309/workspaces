import { Component, Input, OnInit, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { ListViewComponent } from '../../views/list-view/list-view.component';
import { TaskService } from 'src/app/service/features/task/Task.service';
import { Task } from 'src/app/models/task.model';

export type ViewType = 'board' | 'list' | 'gantt' | 'calendar'  ;

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
  // Filtros
  filtroCategoria: string = '';
  filtroFechaInicio: string = ''; // YYYY-MM-DD
  filtroFechaFin: string = '';
  filtroPrioridad: string = '';
  filtroEstado: string = '';

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
      lista_identificador: this.list.identificador,
      espacioTrabajoIdentificador: this.espacioTrabajoIdentificador || this.list?.espacioTrabajoIdentificador,
      espacio_identificador: this.espacioIdentificador || this.list?.espacioIdentificador,
      carpeta_identificador: this.carpetaIdentificador || this.list?.carpetaIdentificador,
  categoria: this.filtroCategoria,
  prioridad: this.filtroPrioridad,
  estado: this.filtroEstado,
  fechaInicio: this.filtroFechaInicio,
  fechaFin: this.filtroFechaFin,
    };
    // limpiar vacíos
    Object.keys(params).forEach(k => (params[k] === undefined || params[k] === null || params[k] === '') && delete params[k]);
    this.taskService.searchTasksFiltered(params).subscribe({
      next: (items) => { this.tasks = Array.isArray(items) ? items : []; },
      error: (e) => { this.error = e?.message || 'Error loading tasks'; this.loading = false; },
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
    // Si estamos en la vista de lista, activar el modo de agregar tarea
    if (this.currentView === 'list' && this.listViewComponent) {
      this.listViewComponent.startAdd('OPEN');
    } else {
      // Si no estamos en la vista de lista, cambiar a ella
      this.currentView = 'list';
      // Usar setTimeout para asegurar que el componente se ha renderizado
      setTimeout(() => {
        if (this.listViewComponent) {
          this.listViewComponent.startAdd('OPEN');
        }
      }, 100);
    }
  }

  clearFilters() {
    this.filtroCategoria = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.filtroPrioridad = '';
    this.filtroEstado = '';
    this.fetchTasks();
  }
}
