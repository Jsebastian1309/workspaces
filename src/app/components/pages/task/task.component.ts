import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ListViewComponent } from '../../views/list-view/list-view.component';

export type ViewType = 'board' | 'list' | 'gantt';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {
  @Input() list: any;
  @Input() espacioTrabajoIdentificador?: string;
  @Input() espacioIdentificador?: string;
  @Input() carpetaIdentificador?: string;

  @ViewChild(ListViewComponent) listViewComponent?: ListViewComponent;

  currentView: ViewType = 'list';

  viewOptions = [
    { key: 'board' as ViewType, label: 'Board', icon: '📋' },
    { key: 'list' as ViewType, label: 'List', icon: '�' },
    { key: 'gantt' as ViewType, label: 'Gantt', icon: '�' }
  ];

  ngOnInit(): void {
    // Aquí puedes inicializar datos si es necesario
  }

  switchView(view: ViewType): void {
    this.currentView = view;
  }

  getCarpetaName(): string {
    // Obtener el nombre de la carpeta desde los datos
    return this.list?.carpetaNombre || 'Carpeta';
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
}
