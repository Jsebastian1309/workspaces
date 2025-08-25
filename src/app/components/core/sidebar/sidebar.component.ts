import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalWorkspaceComponent } from '../../modals/modal-workspace/modal-workspace.component';
import { WorkspaceService } from '../../../service/workspace.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() workspaces: any[] = [];
  @Input() selectedWorkspace: any = null;
  @Input() activeView = 'start';
  @Output() viewChange = new EventEmitter<string>();
  @Output() listSelected = new EventEmitter<any>();

  spacesWork: any[] = [];
  selectedspace: any = null;

  constructor(
    private modalService: NgbModal, 
    private workspaceService: WorkspaceService
  ) {}

  ngOnInit() {
    this.spacesWork = this.workspaces;
    this.selectedspace = this.selectedWorkspace;
  }

  navigateTo(view: string) {
    this.activeView = view;
    this.viewChange.emit(view);
  }

  ngOnChanges() {
    this.spacesWork = this.workspaces;
    this.selectedspace = this.selectedWorkspace;
  }

  selectSpace(space: any) {
    this.selectedspace = space;
  }

  onListSelected(list: any) {
    this.listSelected.emit(list);
  }

  getAvatar(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  openCreateWorkspaceModal() {
    const modalRef = this.modalService.open(ModalWorkspaceComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.title = 'Create New Workspace';
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

  createNewWorkspace(workspaceData: any) {
    this.workspaceService.CreateWorkSpace(workspaceData).subscribe({
      next: (response: any) => {
        this.spacesWork.push(workspaceData);
        this.selectedspace = workspaceData;
        alert('Workspace creado exitosamente!');
      },
      error: (error: any) => {
        if (error.status === 200) {
          this.spacesWork.push(workspaceData);
          this.selectedspace = workspaceData;
          alert('Workspace creado exitosamente!');
        } else {
          alert('Error al crear el workspace.');
        }
      }
    });
  }

  editWorkspace(workspaceData: any) {
    this.workspaceService.UpdateWorkSpace(workspaceData).subscribe({
      next: (response: any) => {
        const index = this.spacesWork.findIndex(space => space.identificador === workspaceData.identificador);
        if (index !== -1) {
          this.spacesWork[index] = workspaceData;
          this.selectedspace = workspaceData;
        }
        alert('Workspace actualizado exitosamente!');
      },
      error: (error: any) => {
        if (error.status === 200) {
          const index = this.spacesWork.findIndex(space => space.identificador === workspaceData.identificador);
          if (index !== -1) {
            this.spacesWork[index] = workspaceData;
            this.selectedspace = workspaceData;
          }
          alert('Workspace actualizado exitosamente!');
        } else {
          alert('Error al actualizar el workspace.');
        }
      }
    });
  }

  deleteWorkspace(workspaceData: any) {
    this.workspaceService.DeleteWorkSpace(workspaceData).subscribe({
      next: (response: any) => {
        this.spacesWork = this.spacesWork.filter(space => space.identificador !== workspaceData.identificador);
        this.selectedspace = this.spacesWork.length > 0 ? this.spacesWork[0] : null;
        alert('Workspace eliminado exitosamente!');
      },
      error: (error: any) => {
        if (error.status === 200) {
          this.spacesWork = this.spacesWork.filter(space => space.identificador !== workspaceData.identificador);
          this.selectedspace = this.spacesWork.length > 0 ? this.spacesWork[0] : null;
          alert('Workspace eliminado exitosamente!');
        } else {
          alert('Error al eliminar el workspace.');
        }
      }
    });
  }
}