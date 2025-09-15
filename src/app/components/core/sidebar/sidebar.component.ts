import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalWorkspaceComponent } from '../../modals/modal-workspace/modal-workspace.component';
import { WorkspaceService } from 'src/app/service/features/workspace/workspace.service';
import { ModalInfoComponent } from '../../modals/modal-info/modal-info.component';
import { ModalDeleteComponent } from '../../modals/modal-delete/modal-delete.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() workspaces: any[] = [];
  @Input() selectedWorkspace: any = null;
  @Input() activeView = 'start';
  @Input() collapsed = false;
  @Output() viewChange = new EventEmitter<string>();
  @Output() listSelected = new EventEmitter<any>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  spacesWork: any[] = [];
  selectedspace: any = null;

  constructor(
    private modalService: NgbModal,
    private workspaceService: WorkspaceService,
    private translate: TranslateService,
  ) { }

  ngOnInit() {
    this.spacesWork = this.workspaces;
    this.selectedspace = this.selectedWorkspace;
  }

  // Navegar entre diferentes vistas
  navigateTo(view: string) {
    this.activeView = view;
    this.viewChange.emit(view);
  }

  // Detectar cambios en las entradas
  ngOnChanges() {
    this.spacesWork = this.workspaces;
    this.selectedspace = this.selectedWorkspace;
  }

  // Seleccionar un espacio de trabajo
  selectSpace(space: any) {
    this.selectedspace = space;
  }

  // Expandir/contraer sidebar
  toggleSidebar() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  // Emitir el espacios de trabajo seleccionado
  onListSelected(list: any) {
    this.listSelected.emit(list);
  }

  // Abrir el modal de información
  openInfo(title: string, description?: string) {
    const modalRef = this.modalService.open(ModalInfoComponent, { centered: true, backdrop: 'static' });
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.description = description ?? '';
    return modalRef.result.catch(() => null);
  }

  // Abrir el modal de eliminación
  openDelete(title: string, message: string) {
    const modalRef = this.modalService.open(ModalDeleteComponent, { centered: true, backdrop: 'static' });
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.confirmLabel = 'Delete';
    modalRef.componentInstance.cancelLabel = 'Cancel';
    return modalRef.result.then(() => true).catch(() => false);
  }

  // Abrir el modal de creación
  openCreateWorkspaceModal() {
    const modalRef = this.modalService.open(ModalWorkspaceComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.title = this.translate.instant('Create New Workspace');
    modalRef.componentInstance.isEditMode = false;
    modalRef.result
      .then((workspaceData: any) => {
        if (workspaceData) {
          this.createNewWorkspace(workspaceData);
        }
      })
      .catch(() => {
      });
  }

  // Abrir el modal de edición
  openEditWorkspaceModal() {
    if (!this.selectedspace) return;
    const modalRef = this.modalService.open(ModalWorkspaceComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.title = 'Edit Workspace';
    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.workspaceData = this.selectedspace;
    modalRef.result
      .then((workspaceData: any) => {
        if (workspaceData) {
          this.editWorkspace(workspaceData);
        }
      })
      .catch(() => {
      });
  }

  // Crear un nuevo espacio de trabajo
  createNewWorkspace(workspaceData: any) {
    const success = (created: any) => {
      const item = created?.data ?? created ?? workspaceData;
      this.spacesWork.push(item);
      this.selectedspace = item;
      this.openInfo(this.translate.instant('Workspace created'), `El workspace "${item?.nombre}" se creó correctamente.`);
    };

    this.workspaceService.CreateWorkSpace(workspaceData).subscribe({
      next: success,
      error: (e) => (e?.status === 200 ? success(workspaceData) : this.openInfo('Error', 'Error al crear el workspace.'))
    });
  }

  // Editar un espacio de trabajo
  editWorkspace(workspaceData: any) {
    const success = () => {
      const i = this.spacesWork.findIndex(s => s.identificador === workspaceData.identificador);
      if (i !== -1) { this.spacesWork[i] = workspaceData; this.selectedspace = workspaceData; }
      this.openInfo('Workspace updated', `El workspace "${workspaceData?.nombre}" se actualizó correctamente.`);
    };
    this.workspaceService.UpdateWorkSpace(workspaceData).subscribe({
      next: success,
      error: (e) => (e?.status === 200 ? success() : this.openInfo('Error', 'Error al actualizar el workspace.'))
    });
  }

  // Eliminar un espacio de trabajo
  deleteWorkspace(workspaceData: any) {
    this.openDelete('Delete workspace', `Are you sure you want to delete "${workspaceData?.nombre}"? This action cannot be undone.`)
      .then((confirmed) => {
        if (!confirmed) return;
        const success = () => {
          this.spacesWork = this.spacesWork.filter(s => s.identificador !== workspaceData.identificador);
          this.selectedspace = this.spacesWork[0] ?? null;
          this.openInfo('Workspace deleted', `El workspace "${workspaceData?.nombre}" se eliminó correctamente.`);
        };
        this.workspaceService.DeleteWorkSpace(workspaceData).subscribe({
          next: success,
          error: (e) => (e?.status === 200 ? success() : this.openInfo('Error', 'Error al eliminar el workspace.'))
        });
      });
  }
}