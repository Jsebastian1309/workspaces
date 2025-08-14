import { Component, OnInit, Input } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateSpaceComponent } from '../create-space/create-space.component';
import { WorkspaceService } from '../../service/space.service';
import { FolderService } from '../../service/folder.service';
import { CreateFolderComponent } from '../create-folder/create-folder.component';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

interface SpaceNode {
  id?: number;
  identificador?: string;
  nombre: string;
  tipo: 'space' | 'folder' | 'task';
  color?: string;
  icono?: string;
  descripcion?: string;
  espacioTrabajoIdentificador?: string;
  children?: SpaceNode[];
  expandable?: boolean;
}

@Component({
  selector: 'app-spaces-tree',
  templateUrl: './spaces-tree.component.html',
  styleUrls: ['./spaces-tree.component.scss']
})
export class SpacesTreeComponent implements OnInit {
  @Input() SelectedWorkspace: any;

  treeControl = new NestedTreeControl<SpaceNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<SpaceNode>();
  isLoading = false;
  // UI state for simple list view
  selectedKey: string | null = null;
  private expandedSpaces = new Set<string>();

  constructor(
    private modalService: NgbModal,
    private workspaceService: WorkspaceService,
    private folderService: FolderService
  ) {}

  ngOnInit() {
    this.cargarSpaces();
  }

  ngOnChanges() {
    if (this.SelectedWorkspace) {
      this.cargarSpaces();
    }
  }

  cargarSpaces() {
    if (!this.SelectedWorkspace || !this.SelectedWorkspace.identificador) {
      this.dataSource.data = [];
      this.isLoading = false;
      return;
    }

    console.log('Cargando spaces para workspace:', this.SelectedWorkspace.identificador);
    this.isLoading = true;
    
    // Llamar al servicio filtrado para obtener los spaces del workspace (solo datos reales)
    this.workspaceService.searchSpacesFiltered(this.SelectedWorkspace.identificador)
      .pipe(
        map((resp: any) => {
          console.log('Respuesta completa de spaces:', resp);
          const spaces = Array.isArray(resp)
            ? resp
            : (resp?.proyEspacioList || resp?.data || resp?.lista || resp?.content || resp?.items || []);
          console.log('Spaces procesados:', spaces);
          return spaces;
        }),
        switchMap((spaces: any[]) => {
          const baseNodes: SpaceNode[] = spaces.map((space: any) => ({
            id: space.id,
            identificador: space.identificador,
            nombre: space.nombre,
            tipo: 'space' as const,
            color: space.color || '#4ecdc4',
            icono: space.icono || (space.nombre ? space.nombre.charAt(0).toUpperCase() : 'S'),
            descripcion: space.descripcion,
            espacioTrabajoIdentificador: space.espacioTrabajoIdentificador,
            expandable: true,
            children: []
          }));

          // Para cada space, cargar folders
          const folderCalls = baseNodes.map(spaceNode =>
            this.folderService.searchFoldersFiltered(this.SelectedWorkspace.identificador, spaceNode.identificador).pipe(
              map((resp: any) => {
                console.log(`Respuesta folders para space ${spaceNode.nombre}:`, resp);
                const folders = Array.isArray(resp)
                  ? resp
                  : (resp?.proyCarpetaList || resp?.data || resp?.lista || resp?.content || resp?.items || []);
                console.log(`Folders procesados para ${spaceNode.nombre}:`, folders);
                return folders;
              }),
              map((folders: any[]) => ({ spaceNode, folders })),
              catchError(err => {
                console.warn('Error cargando folders para space', spaceNode.identificador, err);
                return of({ spaceNode, folders: [] });
              })
            )
          );

          return folderCalls.length ? forkJoin(folderCalls).pipe(map(results => ({ baseNodes, results }))) : of({ baseNodes, results: [] });
        })
      )
      .subscribe({
        next: ({ baseNodes, results }) => {
          // Adjuntar folders a cada space
          for (const { spaceNode, folders } of results || []) {
            spaceNode.children = (folders || []).map((f: any) => ({
              id: f.id,
              identificador: f.identificador,
              nombre: f.nombre,
              tipo: 'folder' as const,
              color: f.color || '#8b5cf6',
              icono: 'folder',
              descripcion: f.descripcion,
              espacioTrabajoIdentificador: f.espacioTrabajoIdentificador,
              expandable: true
            }));
          }
          this.dataSource.data = baseNodes;
          this.isLoading = false;
          // Reset expansion state if needed when data reloads
          const existing = new Set(this.expandedSpaces);
          this.expandedSpaces.clear();
          // Keep expanded if still present by key
          for (const space of baseNodes) {
            const key = this.getKey(space);
            if (existing.has(key)) this.expandedSpaces.add(key);
          }
        },
        error: (error) => {
          console.error('Error al cargar spaces/folders:', error);
          this.dataSource.data = [];
          this.isLoading = false;
        }
      });
  }

  // Los spaces siempre usan el template expandible para mantener el diseño correcto
  hasChild = (_: number, node: SpaceNode) => node.tipo === 'space' || (!!node.children && node.children.length > 0);

  getNodeIcon(node: SpaceNode): string {
    switch (node.tipo) {
      case 'space':
        return node.icono || 'circle';
      case 'folder':
        // Diferenciamos entre listas y carpetas
        if (node.nombre.toLowerCase().includes('lista')) {
          return 'format_list_bulleted';
        }
        return 'folder';
      case 'task':
        return 'task_alt';
      default:
        return 'circle';
    }
  }

  getNodeClass(node: SpaceNode): string {
    return `node-${node.tipo}`;
  }

  isBootstrapIcon(icon?: string): boolean {
    return !!icon && (icon.startsWith('bi-') || icon.includes(' bi-'));
  }

  onNodeClick(node: SpaceNode) {
    console.log('Nodo clickeado:', node);
  this.selectedKey = this.getKey(node);
  // TODO: Implementar lógica para abrir/editar el nodo
  }

  onAddSpace() {
    console.log('Agregar nuevo space para workspace:', this.SelectedWorkspace);
    
    const modalRef = this.modalService.open(CreateSpaceComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });

    modalRef.componentInstance.title = 'Create New Space';
    modalRef.componentInstance.SelectedWorkspace = this.SelectedWorkspace;

    modalRef.result
      .then((spaceData: any) => {
        if (spaceData) {
          console.log('Space creado exitosamente:', spaceData);
          this.cargarSpaces();
        }
      })
      .catch(() => {
        console.log('Create space modal dismissed');
      });
  }

  onAddFolder(parentNode: SpaceNode) {
    console.log('Agregar carpeta a:', parentNode);
    const modalRef = this.modalService.open(CreateFolderComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.title = 'Create New Folder';
    modalRef.componentInstance.SelectedWorkspace = this.SelectedWorkspace;
    modalRef.componentInstance.SelectedSpace = parentNode;

    modalRef.result
      .then((folderData: any) => {
        if (folderData) {
          this.folderService.createFolder(folderData).subscribe({
            next: (resp: any) => {
              console.log('Carpeta creada:', resp);
              this.cargarSpaces();
            },
            error: (err: any) => {
              // Algunos backends devuelven 200 con error de parseo
              if (err && (err.status === 200 || err.status === 201)) {
                console.warn('Tratando respuesta 2xx con error como éxito en carpeta.');
                this.cargarSpaces();
              } else {
                console.error('Error creando carpeta:', err);
              }
            }
          });
        }
      })
      .catch(() => console.log('Create folder modal dismissed'));
  }

  onAddTask(parentNode: SpaceNode) {
    console.log('Agregar tarea a:', parentNode);
    // TODO: Implementar agregar tarea
  }

  onEditNode(node: SpaceNode) {
    console.log('Editar nodo:', node);
    // TODO: Implementar editar nodo
  }

  onDeleteNode(node: SpaceNode) {
    console.log('Eliminar nodo:', node);
    // TODO: Implementar eliminar nodo
  }

  // Helpers for simple list view
  getKey(node: { tipo: string; identificador?: string; nombre?: string }): string {
    return `${node.tipo}:${node.identificador || node.nombre || ''}`;
  }

  toggleSpace(space: SpaceNode) {
    const key = this.getKey(space);
    if (this.expandedSpaces.has(key)) this.expandedSpaces.delete(key);
    else this.expandedSpaces.add(key);
  }

  isExpanded(space: SpaceNode): boolean {
    return this.expandedSpaces.has(this.getKey(space));
  }

  onSelectEverything() {
    this.selectedKey = 'everything';
  }
}
