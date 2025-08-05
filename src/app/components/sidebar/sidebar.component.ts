import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateSpaceComponent } from '../create-space/create-space.component';
import { CreateWorkspaceComponent } from '../create-workspace/create-workspace.component';
import { TreeModel } from 'ng2-tree';
import { WorkspaceService } from '../../service/workspace.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  spacesWork: any[] = [];
  selectedspace: any = null;
  tree: TreeModel = {
    value: 'Everything',
    settings: {
      'static': false,
      'leftMenu': true,
      'rightMenu': true
    },
    children: [
      {
        value: 'Team Space',
        settings: {
          'static': false,
          'leftMenu': true,
          'rightMenu': true
        },
        children: [
          { 
            value: 'Project 1',
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            }
          },
                    { 
            value: 'Project 1',
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            }
          },
                    { 
            value: 'Project 1',
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            }
          },
                    { 
            value: 'Project 1',
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            }
          },
                    { 
            value: 'Project 1',
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            }
          },
                    { 
            value: 'Project 1',
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            }
          },
                    { 
            value: 'Project 1',
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            }
          },          { 
            value: 'Project 1',
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            }
          },

                    { 
            value: 'Project 1',
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            }
          },
          { 
            value: 'Project 2',
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            }
          },
          { 
            value: 'Project Notes',
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            }
          }
        ]
      }
    ]
  };

  settings = {
    rootIsVisible: true
  };

  constructor(private modalService: NgbModal, private workspaceService: WorkspaceService) {}

  ngOnInit() {
    this.cargarEspaciosTrabajo();
  }

  cargarEspaciosTrabajo() {
    this.workspaceService.listWorkSpaces().subscribe({
      next: (espacios: any[]) => {
        this.spacesWork = espacios;
        console.log('Espacios de trabajo cargados:', this.spacesWork);
        if (espacios.length > 0) {
          this.selectedspace = espacios[0];
        }
      },
      error: (error: any) => {
        console.error('Error al cargar espacios de trabajo:', error);
      }
    });
  }

  seleccionarEspacio(espacio: any) {
    this.selectedspace = espacio;
  }

  obtenerAvatar(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : 'W';
  }

  handleRemoved(e: any) {
    console.log('Node removed:', e);
  }

  handleRenamed(e: any) {
    console.log('Node renamed:', e);
  }

  handleSelected(e: any) {
    console.log('Node selected:', e);
  }

  handleMoved(e: any) {
    console.log('Node moved:', e);
  }

  handleCreated(e: any) {
    console.log('Node created:', e);
  }

  handleExpanded(e: any) {
    console.log('Node expanded:', e);
  }

  handleCollapsed(e: any) {
    console.log('Node collapsed:', e);
  }

  handleNextLevel(e: any) {
    console.log('Load next level:', e);
  }

  openCreateSpaceModal() {
    const modalRef = this.modalService.open(CreateSpaceComponent, {
      centered: true,
      backdrop: 'static'
    });

    modalRef.componentInstance.title = 'Create New Space';

    modalRef.result
      .then((spaceName: string) => {
        if (spaceName) {
          const newSpace = {
            value: spaceName,
            settings: {
              'static': false,
              'leftMenu': true,
              'rightMenu': true
            },
            children: []
          };
          this.tree.children?.push(newSpace);
        }
      })
      .catch(() => {
        console.log('Modal dismissed');
      });
  }

  openCreateWorkspaceModal() {
    const modalRef = this.modalService.open(CreateWorkspaceComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });

    modalRef.componentInstance.title = 'Create New Workspace';

    modalRef.result
      .then((workspaceData: any) => {
        if (workspaceData) {
          this.crearNuevoWorkspace(workspaceData);
        }
      })
      .catch(() => {
        console.log('Create workspace modal dismissed');
      });
  }

  crearNuevoWorkspace(workspaceData: any) {
    this.workspaceService.CreateWorkSpace(workspaceData).subscribe({
      next: (response: any) => {
        console.log('Workspace creado exitosamente:', response);
        this.cargarEspaciosTrabajo();
        alert('Workspace creado exitosamente!');
      },
      error: (error: any) => {
        console.error('Error al crear workspace:', error);
        alert('Error al crear el workspace. Por favor, intenta de nuevo.');
      }
    });
  }
}