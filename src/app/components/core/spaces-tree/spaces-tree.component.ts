import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SpaceService } from 'src/app/service/features/space/Space.service';
import { FolderService } from 'src/app/service/features/folder/Folder.service';
import { ModalFolderComponent } from '../../modals/modal-folder/modal-folder.component';
import { ModalListComponent } from '../../modals/modal-list/modal-list.component';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ListService } from 'src/app/service/features/list/List.service';
import { ModalSpaceComponent } from '../../modals/modal-space/modal-space.component';
import { ModalDeleteComponent } from '../../modals/modal-delete/modal-delete.component';
import { ModalInfoComponent } from '../../modals/modal-info/modal-info.component';

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
  ) { }

  ngOnInit() {
    this.loadSpaces();
  }

  ngOnChanges() {
    if (this.SelectedWorkspace) {
      this.loadSpaces();
    }
  }

  loadSpaces() {
    if (!this.SelectedWorkspace?.identificador) { this.isLoading = false; return; }
    this.isLoading = true;
    this.SpaceService.searchSpacesFiltered(this.SelectedWorkspace.identificador)
      .pipe(
        switchMap((spaces: any[]) => {
          const baseNodes: SpaceNode[] = (spaces || []).map((space: any) => ({
            id: space.id,
            identificador: space.identificador,
            nombre: space.nombre,
            tipo: 'space' as const,
            color: space.color,
            icono: space.icono,
            descripcion: space.descripcion,
            espacioTrabajoIdentificador: space.espacioTrabajoIdentificador,
            expandable: true,
            children: []
          }));

          const folderCalls = baseNodes.map(spaceNode =>
            this.folderService.searchFoldersFiltered(this.SelectedWorkspace.identificador, spaceNode.identificador)
              .pipe(map((folders: any[]) => ({ spaceNode, folders })), catchError(() => of({ spaceNode, folders: [] })))
          );

          return folderCalls.length ? forkJoin(folderCalls).pipe(map(results => ({ baseNodes, results }))) : of({ baseNodes, results: [] });
        })
      )
      .subscribe({
        next: ({ baseNodes, results }) => {
          const allFolderNodes: SpaceNode[] = [];
          for (const { spaceNode, folders } of results || []) {
            const folderNodes = (folders || []).map((f: any) => ({
              id: f.id,
              identificador: f.identificador,
              nombre: f.nombre,
              tipo: 'folder' as const,
              color: f.color,
              icono: 'folder',
              descripcion: f.descripcion,
              espacioTrabajoIdentificador: f.espacioTrabajoIdentificador,
              expandable: true,
              children: []
            }));
            spaceNode.children = folderNodes;
            allFolderNodes.push(...folderNodes);
          }

          if (!allFolderNodes.length) { this.dataSource.data = baseNodes; this.isLoading = false; this._restoreExpansion(baseNodes); return; }

          const listCalls = allFolderNodes.map(folderNode =>
            this.listService.searchListsFiltered(folderNode.identificador || '')
              .pipe(map((lists: any[]) => ({ folderNode, lists })), catchError(() => of({ folderNode, lists: [] })))
          );

          forkJoin(listCalls).subscribe({
            next: (pairs) => {
              for (const { folderNode, lists } of pairs) {
                const parentSpace = baseNodes.find(space => space.children?.some(folder => folder.identificador === folderNode.identificador));
                folderNode.children = (lists || []).map((l: any) => ({
                  id: l.id,
                  identificador: l.identificador,
                  nombre: l.nombre,
                  tipo: 'list' as const,
                  descripcion: l.descripcion,
                  expandable: true,
                  espacioTrabajoIdentificador: folderNode.espacioTrabajoIdentificador || parentSpace?.espacioTrabajoIdentificador,
                  espacioIdentificador: parentSpace?.identificador,
                  carpetaIdentificador: folderNode.identificador
                }));
              }
              this.dataSource.data = baseNodes; this.isLoading = false; this._restoreExpansion(baseNodes);
            },
            error: () => { this.dataSource.data = baseNodes; this.isLoading = false; this._restoreExpansion(baseNodes); }
          });
        },
        error: () => { this.dataSource.data = []; this.isLoading = false; }
      });
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

  // Abrir el modal de creación de espacio
  openCreateSpaceModal() {
    const modalRef = this.modalService.open(ModalSpaceComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.title = 'Create New Space';
    modalRef.componentInstance.isEditMode = false;
    modalRef.componentInstance.SelectedWorkspace = this.SelectedWorkspace;
    modalRef.result
      .then((spaceData: any) => {
        if (spaceData) {
          this.createNewSpace(spaceData);
        }
      })
      .catch(() => { });
  }

  createNewSpace(spaceData: any) {
    const success = () => {
      this.openInfo('Space created', `El espacio "${spaceData?.nombre}" se creó correctamente.`);
      this.loadSpaces();
    };
    this.SpaceService.CreateSpace(spaceData).subscribe({
      next: () => success(),
      error: (e) => (e?.status === 200 || e?.status === 201) ? success()
        : this.openInfo('Error', 'Error al crear el espacio.')
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
              this.loadSpaces();
            },
            error: (err: any) => {
              // Algunos backends devuelven 200 con error de parseo
              if (err && (err.status === 200 || err.status === 201)) {
                console.warn('Tratando respuesta 2xx con error como éxito en carpeta.');
                this.loadSpaces();
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
          this.loadSpaces();
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
            this.loadSpaces();
          }
        })
        .catch(() => { });
    } else if (node.tipo === 'folder') {
      // TODO: abrir modal de carpeta en modo edición cuando esté disponible
      console.warn('Editar carpeta aún no implementado');
    } else if (node.tipo === 'list') {
      // TODO: abrir modal de lista en modo edición cuando esté disponible
      console.warn('Editar lista aún no implementado');
    }
  }

  onEditFolder(node: SpaceNode) {
    console.log('Editar carpeta:', node);
    const modalRef = this.modalService.open(ModalFolderComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.title = 'Edit Folder';
    modalRef.componentInstance.SelectedWorkspace = this.SelectedWorkspace;
    modalRef.componentInstance.SelectedSpace = undefined; // opcional
    modalRef.componentInstance.SelectedFolder = node;

    modalRef.result
      .then((updated: any) => {
        if (updated) {
          // Si el modal ya llamó al servicio, solo recargamos
          this.loadSpaces();
        }
      })
      .catch(() => { });
  }

  onDeleteNode(node: SpaceNode) {
    console.log('Eliminar nodo:', node);
    if (node.tipo === 'space') {
      const ok = confirm(`Are you sure you want to delete the space "${node.nombre}"?`);
      if (!ok) return;
      this.SpaceService.deleteSpace({ identificador: node.identificador }).subscribe({
        next: () => this.loadSpaces(),
        error: (err) => {
          console.error('Error deleting space', err);
          // A veces 200 viene en error
          if (err?.status === 200) this.loadSpaces();
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
