import { Component } from '@angular/core';
import { WorkspaceService } from 'src/app/service/workspace.service';

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

  constructor(private workspaceService: WorkspaceService) {}

  ngOnInit() {
    this.loadWorkspaces();
  }
  onViewChange(view: string) {
    this.currentView = view;
  }

  onListSelected(list: any) {
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
}