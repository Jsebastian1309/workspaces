import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SpaceService } from 'src/app/service/features/space/space.service';
import { FolderService } from 'src/app/service/features/folder/folder.service';
import { ModalFolderComponent } from '../../modals/modal-folder/modal-folder.component';
import { ModalListComponent } from '../../modals/modal-list/modal-list.component';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ListService } from 'src/app/service/features/list/list.service';
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
  templateEstadoIdentificador?: string;
  // display helper names
  espacioTrabajoNombre?: string;
  espacioNombre?: string;
  carpetaNombre?: string;
  folders?: SpaceNode[];
  lists?: SpaceNode[];
  expandable?: boolean;
  // keep original backend object when available (for delete, etc.)
  raw?: any;
}

@Component({
  selector: 'app-spaces-tree',
  templateUrl: './spaces-tree.component.html',
  styleUrls: ['./spaces-tree.component.scss']
})
export class SpacesTreeComponent implements OnInit {
  @Input() SelectedWorkspace: any;
  @Output() listSelected = new EventEmitter<any>();

  treeControl = new NestedTreeControl<SpaceNode>(node => node.folders || node.lists || []);
  dataSource = new MatTreeNestedDataSource<SpaceNode>();
  isLoading = false;
  selectedKey: string | null = null;
  private expandedSpaces = new Set<string>();
  private expandedFolders = new Set<string>();

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
            estado: space.estado,
            publico: space.publico,
            organizacionId: space.organizacionId,
            clienteId: space.clienteId,
            descripcion: space.descripcion,
            espacioTrabajoIdentificador: space.espacioTrabajoIdentificador,
            expandable: true,
            folders: [],
            raw: space
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
              espacioIdentificador: spaceNode.identificador,
              expandable: true,
              lists: [],
              raw: f
            }));
            spaceNode.folders = folderNodes;
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
                const parentSpace = baseNodes.find(space => space.folders?.some(folder => folder.identificador === folderNode.identificador));

                const listNodes: SpaceNode[] = (lists || []).map((l: any) => ({
                  id: l.id,
                  identificador: l.identificador,
                  nombre: l.nombre,
                  templateEstadoIdentificador: l.templateEstadoIdentificador,
                  tipo: 'list' as const,
                  descripcion: l.descripcion,
                  expandable: true,
                  espacioTrabajoIdentificador: folderNode.espacioTrabajoIdentificador || parentSpace?.espacioTrabajoIdentificador,
                  espacioIdentificador: parentSpace?.identificador,
                  carpetaIdentificador: folderNode.identificador,

                  espacioTrabajoNombre: this.SelectedWorkspace?.nombre,
                  espacioNombre: parentSpace?.nombre,
                  carpetaNombre: folderNode.nombre,
                  raw: l
                }));
                folderNode.lists = listNodes;

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

  openEditSpaceModal(spaceNode: SpaceNode) {
    const modalRef = this.modalService.open(ModalSpaceComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.title = 'Edit Space';
    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.SelectedWorkspace = this.SelectedWorkspace;
    modalRef.componentInstance.spaceData = spaceNode;
    modalRef.result
      .then((spaceData: any) => {
        if (spaceData) {
          this.editSpace(spaceData);
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

  editSpace(spaceData: any) {
    const success = () => {
      this.openInfo('Space updated', `El espacio "${spaceData?.nombre}" se actualizó correctamente.`);
      this.loadSpaces();
    };
    this.SpaceService.updateSpace(spaceData).subscribe({
      next: () => success(),
      error: (e) => (e?.status === 200 || e?.status === 201) ? success()
        : this.openInfo('Error', 'Error al actualizar el espacio.')
    });
  }

  deleteSpace(node: SpaceNode) {
    this.openDelete('Delete space', `Are you sure you want to delete the space "${node.nombre}"?`)
      .then((confirmed) => {
        if (!confirmed) return;
        const payload = node.raw || node;
        const success = () => {
          this.openInfo('Space deleted', `El espacio "${node.nombre}" se eliminó correctamente.`);
          this.loadSpaces();
        };
        this.SpaceService.deleteSpace(payload).subscribe({
          next: success,
          error: (err) => {
            console.error('Error deleting space', err);
            if (err?.status === 200) success();
            else this.openInfo('Error', 'Error al eliminar el espacio.');
          }
        });
      });
  }

  deleteList(list: SpaceNode) {
    this.openDelete('Delete list', `Are you sure you want to delete the list "${list.nombre}"?`)
      .then((confirmed) => {
        if (!confirmed) return;
        const success = () => {
          this.openInfo('List deleted', `La lista "${list.nombre}" se eliminó correctamente.`);
          this.loadSpaces();
        };
        this.listService.deleteList(list).subscribe({
          next: success,
          error: (err) => {
            console.error('Error deleting list', err);
            if (err?.status === 200) success();
            else this.openInfo('Error', 'Error al eliminar la lista.');
          }
        });
      });
  }

  // Los spaces siempre usan el template expandible para mantener el diseño correcto
  hasChild = (_: number, node: SpaceNode) => {
    if (node.tipo === 'space') return !!(node.folders && node.folders.length > 0);
    if (node.tipo === 'folder') return !!(node.lists && node.lists.length > 0);
    return false;
  };

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
      this.onEditFolder(node);
    } else if (node.tipo === 'list') {
      this.onEditList(node);
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
    modalRef.componentInstance.SelectedSpace = this.getParentSpaceOfFolder(node) || undefined;
    (modalRef.componentInstance as any).isEditMode = true;
    (modalRef.componentInstance as any).SelectedFolder = node;

    modalRef.result
      .then((updated: any) => {
        if (updated) {
          const success = () => {
            this.openInfo('Folder updated', `La carpeta "${updated?.nombre || node.nombre}" se actualizó correctamente.`);
            this.loadSpaces();
          };
          this.folderService.updateFolder(updated).subscribe({
            next: () => success(),
            error: (e) => (e?.status === 200 || e?.status === 201) ? success()
              : this.openInfo('Error', 'Error al actualizar la carpeta.')
          });
        }
      })
      .catch(() => { });
  }

  onDeleteNode(node: SpaceNode) {
    console.log('Eliminar nodo:', node);
    if (node.tipo === 'space') {
      this.openDelete('Delete space', `Are you sure you want to delete the space "${node.nombre}"?`)
        .then((confirmed) => {
          if (!confirmed) return;
          const payload = node.raw || node;
          const success = () => {
            this.openInfo('Space deleted', `El espacio "${node.nombre}" se eliminó correctamente.`);
            this.loadSpaces();
          };
          this.SpaceService.deleteSpace(payload).subscribe({
            next: success,
            error: (err) => {
              console.error('Error deleting space', err);
              // Algunos backends envían 200 en error
              if (err?.status === 200) success();
              else this.openInfo('Error', 'Error al eliminar el espacio.');
            }
          });
        });
    } else if (node.tipo === 'folder') {
      this.openDelete('Delete folder', `Are you sure you want to delete the folder "${node.nombre}"?`)
        .then((confirmed) => {
          if (!confirmed) return;
          const payload = node.raw || { identificador: node.identificador };
          const success = () => {
            this.openInfo('Folder deleted', `La carpeta "${node.nombre}" se eliminó correctamente.`);
            this.loadSpaces();
          };
          this.folderService.deleteFolder(payload).subscribe({
            next: () => success(),
            error: (err) => {
              console.error('Error deleting folder', err);
              if (err?.status === 200 || err?.status === 201) success();
              else this.openInfo('Error', 'Error al eliminar la carpeta.');
            }
          });
        });
    } else if (node.tipo === 'list') {
      this.openDelete('Delete list', `Are you sure you want to delete the list "${node.nombre}"?`)
        .then((confirmed) => {
          if (!confirmed) return;
          const payload = node.raw || { identificador: node.identificador };
          const success = () => {
            this.openInfo('List deleted', `La lista "${node.nombre}" se eliminó correctamente.`);
            this.loadSpaces();
          };
          this.listService.deleteList(payload).subscribe({
            next: () => success(),
            error: (err) => {
              console.error('Error deleting list', err);
              if (err?.status === 200 || err?.status === 201) success();
              else this.openInfo('Error', 'Error al eliminar la lista.');
            }
          });
        });
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

  toggleFolder(folder: SpaceNode) {
    const key = this.getKey(folder);
    if (this.expandedFolders.has(key)) this.expandedFolders.delete(key);
    else this.expandedFolders.add(key);
  }

  isFolderExpanded(folder: SpaceNode): boolean {
    return this.expandedFolders.has(this.getKey(folder));
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

  // Helpers to locate parents
  private getParentSpaceOfFolder(folder: SpaceNode): SpaceNode | undefined {
    const spaces = this.dataSource.data || [];
    for (const s of spaces) {
      if (s.folders?.some(f => (f.identificador || f.id) === (folder.identificador || folder.id))) {
        return s;
      }
    }
    return undefined;
  }

  private getParentFolderOfList(list: SpaceNode): SpaceNode | undefined {
    const spaces = this.dataSource.data || [];
    for (const s of spaces) {
      for (const f of s.folders || []) {
        if (f.lists?.some(l => (l.identificador || l.id) === (list.identificador || list.id))) {
          return f;
        }
      }
    }
    return undefined;
  }

  onEditList(node: SpaceNode) {
    console.log('Editar lista:', node);
    const modalRef = this.modalService.open(ModalListComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.title = 'Edit List';
    modalRef.componentInstance.SelectedWorkspace = this.SelectedWorkspace;
    modalRef.componentInstance.SelectedSpace = undefined;
    modalRef.componentInstance.SelectedFolder = this.getParentFolderOfList(node) || { identificador: node.carpetaIdentificador };
    (modalRef.componentInstance as any).isEditMode = true;
    (modalRef.componentInstance as any).SelectedList = node;

    modalRef.result
      .then((updated: any) => {
        if (updated) {
          // El modal realiza update internamente; solo recargamos
          this.loadSpaces();
        }
      })
      .catch(() => { });
  }

  // trackBy helpers to reduce re-renders and avoid portal host reuse issues
  trackBySpace = (_: number, node: SpaceNode) => node.identificador || node.id || node.nombre;
  trackByFolder = (_: number, node: SpaceNode) => `f:${node.identificador || node.id || node.nombre}`;
  trackByList = (_: number, node: SpaceNode) => `l:${node.identificador || node.id || node.nombre}`;

  // ngbDropdown handles open/close
}
