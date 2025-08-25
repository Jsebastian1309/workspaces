import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SpaceService } from 'src/app/service/space.service';
import { FolderService } from '../../../service/folder.service';
import { ModalFolderComponent } from '../../modals/modal-folder/modal-folder.component';
import { ModalListComponent } from '../../modals/modal-list/modal-list.component';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ListService } from '../../../service/list.service';
import { ModalSpaceComponent } from '../../modals/modal-space/modal-space.component';

interface SpaceNode {
  id?: number;
  identificador?: string;
  nombre: string;
  tipo: 'space' | 'folder' | 'list' | 'task';
  color?: string;
  icono?: string;
  descripcion?: string;
  espacioTrabajoIdentificador?: string;
  espacioIdentificador?: string;
  carpetaIdentificador?: string;
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
  @Output() listSelected = new EventEmitter<any>();

  treeControl = new NestedTreeControl<SpaceNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<SpaceNode>();
  isLoading = false;
  // UI state for simple list view
  selectedKey: string | null = null;
  private expandedSpaces = new Set<string>();

  constructor(
    private modalService: NgbModal,
    private SpaceService: SpaceService,
    private folderService: FolderService,
  private listService: ListService
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
    this.SpaceService.searchSpacesFiltered(this.SelectedWorkspace.identificador)
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
          const allFolderNodes: SpaceNode[] = [];
          for (const { spaceNode, folders } of results || []) {
            const folderNodes = (folders || []).map((f: any) => ({
              id: f.id,
              identificador: f.identificador,
              nombre: f.nombre,
              tipo: 'folder' as const,
              color: f.color || '#8b5cf6',
              icono: 'folder',
              descripcion: f.descripcion,
              espacioTrabajoIdentificador: f.espacioTrabajoIdentificador,
              expandable: true,
              children: []
            }));
            spaceNode.children = folderNodes;
            allFolderNodes.push(...folderNodes);
          }

          // Si no hay carpetas, establecemos data y terminamos
          if (!allFolderNodes.length) {
            this.dataSource.data = baseNodes;
            this.isLoading = false;
            this._restoreExpansion(baseNodes);
            return;
          }

          // Cargar listas para cada carpeta por carpetaIdentificador
          const listCalls = allFolderNodes.map(folderNode =>
            this.listService.searchListsFiltered(folderNode.identificador || '').pipe(
              map((resp: any) => {
                const lists = Array.isArray(resp)
                  ? resp
                  : (resp?.proyListaList || resp?.data || resp?.lista || resp?.content || resp?.items || []);
                return { folderNode, lists };
              }),
              catchError(err => {
                console.warn('Error cargando listas para carpeta', folderNode.identificador, err);
                return of({ folderNode, lists: [] });
              })
            )
          );

          forkJoin(listCalls).subscribe({
            next: (pairs) => {
              for (const { folderNode, lists } of pairs) {
                // Encontrar el space padre del folderNode
                const parentSpace = baseNodes.find(space => 
                  space.children?.some(folder => folder.identificador === folderNode.identificador)
                );
                
                folderNode.children = (lists || []).map((l: any) => ({
                  id: l.id,
                  identificador: l.identificador,
                  nombre: l.nombre,
                  tipo: 'list' as const,
                  descripcion: l.descripcion,
                  expandable: false,
                  // Agregar información del contexto padre
                  espacioTrabajoIdentificador: folderNode.espacioTrabajoIdentificador || parentSpace?.espacioTrabajoIdentificador,
                  espacioIdentificador: parentSpace?.identificador,
                  carpetaIdentificador: folderNode.identificador
                }));
              }
              this.dataSource.data = baseNodes;
              this.isLoading = false;
              this._restoreExpansion(baseNodes);
            },
            error: (err) => {
              console.error('Error al cargar listas:', err);
              this.dataSource.data = baseNodes;
              this.isLoading = false;
              this._restoreExpansion(baseNodes);
            }
          });
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
    
    if (node.tipo === 'list') {
      console.log('Lista seleccionada con datos completos:', {
        identificador: node.identificador,
        nombre: node.nombre,
        espacioTrabajoIdentificador: node.espacioTrabajoIdentificador,
        espacioIdentificador: node.espacioIdentificador,
        carpetaIdentificador: node.carpetaIdentificador
      });
      this.listSelected.emit(node);
    }
  }

  onAddSpace() {
    console.log('Agregar nuevo space para workspace:', this.SelectedWorkspace);
    
    const modalRef = this.modalService.open(ModalSpaceComponent, {
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
    const modalRef = this.modalService.open(ModalFolderComponent, {
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

  // onAddTask removido por ahora; tareas irán dentro de las listas

  onAddList(folderNode: SpaceNode) {
    console.log('Agregar lista a carpeta:', folderNode);
    const modalRef = this.modalService.open(ModalListComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.title = 'Create New List';
    modalRef.componentInstance.SelectedWorkspace = this.SelectedWorkspace;
    modalRef.componentInstance.SelectedSpace = undefined; // opcional
    modalRef.componentInstance.SelectedFolder = folderNode;

    modalRef.result
      .then((result: any) => {
        if (result) {
          // Tras crear, recargar arbol
          this.cargarSpaces();
        }
      })
      .catch(() => console.log('Create list modal dismissed'));
  }

  onEditNode(node: SpaceNode) {
    console.log('Editar nodo:', node);
    if (node.tipo === 'space') {
      const modalRef = this.modalService.open(ModalSpaceComponent, {
        centered: true,
        backdrop: 'static',
        size: 'lg'
      });
      modalRef.componentInstance.title = 'Edit Space';
      modalRef.componentInstance.SelectedWorkspace = this.SelectedWorkspace;
      modalRef.componentInstance.isEditMode = true;
      modalRef.componentInstance.spaceData = node;

      modalRef.result
        .then((updated: any) => {
          if (updated) {
            // Si el modal ya llamó al servicio, solo recargamos
            this.cargarSpaces();
          }
        })
        .catch(() => {});
    } else if (node.tipo === 'folder') {
      // TODO: abrir modal de carpeta en modo edición cuando esté disponible
      console.warn('Editar carpeta aún no implementado');
    } else if (node.tipo === 'list') {
      // TODO: abrir modal de lista en modo edición cuando esté disponible
      console.warn('Editar lista aún no implementado');
    }
  }

  onDeleteNode(node: SpaceNode) {
    console.log('Eliminar nodo:', node);
    if (node.tipo === 'space') {
      const ok = confirm(`Are you sure you want to delete the space "${node.nombre}"?`);
      if (!ok) return;
      this.SpaceService.deleteSpace({ identificador: node.identificador }).subscribe({
        next: () => this.cargarSpaces(),
        error: (err) => {
          console.error('Error deleting space', err);
          // A veces 200 viene en error
          if (err?.status === 200) this.cargarSpaces();
        }
      });
    } else if (node.tipo === 'folder') {
      // TODO: implementar eliminación de carpeta usando FolderService cuando el backend esté listo
      console.warn('Eliminar carpeta aún no implementado');
    } else if (node.tipo === 'list') {
      // TODO: implementar eliminación de lista usando ListService cuando el backend esté listo
      console.warn('Eliminar lista aún no implementado');
    }
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

  private _restoreExpansion(baseNodes: SpaceNode[]) {
    const existing = new Set(this.expandedSpaces);
    this.expandedSpaces.clear();
    for (const space of baseNodes) {
      const key = this.getKey(space);
      if (existing.has(key)) this.expandedSpaces.add(key);
    }
  }

  // trackBy helpers to reduce re-renders and avoid portal host reuse issues
  trackBySpace = (_: number, node: SpaceNode) => node.identificador || node.id || node.nombre;
  trackByFolder = (_: number, node: SpaceNode) => `f:${node.identificador || node.id || node.nombre}`;
  trackByList = (_: number, node: SpaceNode) => `l:${node.identificador || node.id || node.nombre}`;

  // ngbDropdown handles open/close
}
