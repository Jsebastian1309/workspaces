import { Component } from '@angular/core';
import { WorkspaceService } from 'src/app/service/features/workspace/workspace.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  isLoading = true;
  workspaces: any[] = [];
  selectedWorkspace: any = null;
  currentView = 'start';
  selectedList: any = null;
  sidebarCollapsed = false;

  constructor(private workspaceService: WorkspaceService) {}

  ngOnInit() {
    this.loadWorkspaces();
  }
  onViewChange(view: string) {
    this.currentView = view;
    if (view === 'start') {
      this.selectedList = null;
    }
  }

  onListSelected(list: any) {
    console.log('Lista seleccionada en Home:', list);
    console.log('Propiedades de la lista:', {
      identificador: list?.identificador,
      espacioIdentificador: list?.espacioIdentificador,
      carpetaIdentificador: list?.carpetaIdentificador,
      espacioTrabajoIdentificador: list?.espacioTrabajoIdentificador
    });
    this.selectedList = list;
    this.currentView = 'list-view';
  }

  loadWorkspaces() {
    this.isLoading = true;
    
    this.workspaceService.listWorkSpaces().subscribe({
      next: (spaces: any[]) => {
        console.log('Workspaces cargados en Home:', spaces);
        this.workspaces = spaces;
        if (spaces.length > 0) {
          this.selectedWorkspace = spaces[0];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando workspaces:', error);
        this.isLoading = false;
      }
    });
  }

  onSidebarCollapsedChange(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }
}