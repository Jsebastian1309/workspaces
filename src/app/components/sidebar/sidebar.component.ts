import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateWorkspaceComponent } from '../create-workspace/create-workspace.component';
import { WorkspaceService } from '../../service/workspace.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() workspaces: any[] = [];
  @Input() selectedWorkspace: any = null;
  @Output() viewChange = new EventEmitter<string>();
  @Output() listSelected = new EventEmitter<any>();
  activeView = 'start';

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
    const modalRef = this.modalService.open(CreateWorkspaceComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.title = 'Create New Workspace';
    modalRef.componentInstance.isEditMode = false;
    modalRef.result
      .then((workspaceData: any) => {
        if (workspaceData) {
          this.crearNuevoWorkspace(workspaceData);
        }
      })
      .catch(() => {
      });
  }

  openEditWorkspaceModal() {
    if (!this.selectedspace) return;
    
    const modalRef = this.modalService.open(CreateWorkspaceComponent, {
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
          this.editarWorkspace(workspaceData);
        }
      })
      .catch(() => {
      });
  }

  crearNuevoWorkspace(workspaceData: any) {
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

  editarWorkspace(workspaceData: any) {
    this.workspaceService.UpdateWorkSpace(workspaceData).subscribe({
      next: (response: any) => {
        // Actualizar el workspace en la lista
        const index = this.spacesWork.findIndex(space => space.identificador === workspaceData.identificador);
        if (index !== -1) {
          this.spacesWork[index] = workspaceData;
          this.selectedspace = workspaceData;
        }
        alert('Workspace actualizado exitosamente!');
      },
      error: (error: any) => {
        if (error.status === 200) {
          // Actualizar el workspace en la lista
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
}