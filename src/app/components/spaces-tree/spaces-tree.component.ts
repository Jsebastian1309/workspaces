import { Component, OnInit, Input } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateSpaceComponent } from '../create-space/create-space.component';
import { WorkspaceService } from '../../service/space.service';

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
  @Input() espacioTrabajoSeleccionado: any;

  treeControl = new NestedTreeControl<SpaceNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<SpaceNode>();
  isLoading = false;

  constructor(
    private modalService: NgbModal,
    private workspaceService: WorkspaceService
  ) {}

  ngOnInit() {
    this.cargarSpaces();
  }

  ngOnChanges() {
    // Cuando cambie el workspace seleccionado, recargar los spaces
    if (this.espacioTrabajoSeleccionado) {
      this.cargarSpaces();
    }
  }

  cargarSpaces() {
    if (!this.espacioTrabajoSeleccionado || !this.espacioTrabajoSeleccionado.identificador) {
      this.dataSource.data = [];
      this.isLoading = false;
      return;
    }

    console.log('Cargando spaces para workspace:', this.espacioTrabajoSeleccionado.identificador);
    this.isLoading = true;
    
    // Llamar al servicio para obtener los spaces del workspace
    this.workspaceService.listSpacesByWorkspace(this.espacioTrabajoSeleccionado.identificador)
      .subscribe({
        next: (spaces: any[]) => {
          console.log('Spaces recibidos del backend:', spaces);
          
          // Transformar los datos del backend al formato del tree
          const spacesData: SpaceNode[] = spaces.map(space => ({
            id: space.id,
            identificador: space.identificador,
            nombre: space.nombre,
            tipo: 'space' as const,
            color: space.color || '#4ecdc4',
            icono: space.icono || space.nombre.charAt(0).toUpperCase(),
            descripcion: space.descripcion,
            espacioTrabajoIdentificador: space.espacioTrabajoIdentificador,
            children: [
              // Ejemplo de lista y carpeta para cada space
              {
                nombre: 'Lista de Tareas',
                tipo: 'folder',
                children: [
                  { nombre: 'Tarea 1', tipo: 'task' },
                  { nombre: 'Tarea 2', tipo: 'task' }
                ]
              },
              {
                nombre: 'Carpeta Documentos',
                tipo: 'folder',
                children: [
                  { nombre: 'Archivo importante.doc', tipo: 'task' }
                ]
              }
            ],
            expandable: true
          }));

          this.dataSource.data = spacesData;
          this.isLoading = false;
          
          // Auto-expandir todos los spaces para mostrar el contenido
          setTimeout(() => {
            spacesData.forEach(space => {
              this.treeControl.expand(space);
            });
          }, 100);
        },
        error: (error) => {
          console.error('Error al cargar spaces:', error);
          // Mostrar datos de ejemplo en caso de error
          this.cargarSpacesEjemplo();
          this.isLoading = false;
        }
      });
  }

  private cargarSpacesEjemplo() {
    // Datos de ejemplo para desarrollo - mostrando listas y carpetas
    const spacesData: SpaceNode[] = [
      {
        nombre: 'Everything',
        tipo: 'space',
        color: '#6366f1',
        icono: '✱',
        children: [
          {
            nombre: 'Lista Principal',
            tipo: 'folder',
            children: [
              { nombre: 'Configurar proyecto', tipo: 'task' },
              { nombre: 'Revisar documentación', tipo: 'task' }
            ]
          },
          {
            nombre: 'Carpeta de Recursos',
            tipo: 'folder',
            children: [
              { nombre: 'Manual de usuario', tipo: 'task' },
              { nombre: 'Guía de instalación', tipo: 'task' }
            ]
          }
        ]
      },
      {
        nombre: 'Team Space',
        tipo: 'space',
        color: '#10b981',
        icono: '👥',
        children: [
          {
            nombre: 'Lista de Sprints',
            tipo: 'folder',
            children: [
              { nombre: 'Sprint 1 - Planning', tipo: 'task' },
              { nombre: 'Sprint 2 - Development', tipo: 'task' }
            ]
          },
          {
            nombre: 'Carpeta de Meetings',
            tipo: 'folder',
            children: [
              { nombre: 'Daily Standups', tipo: 'task' },
              { nombre: 'Weekly Reviews', tipo: 'task' }
            ]
          }
        ]
      }
    ];

    this.dataSource.data = spacesData;
    
    // Auto-expandir para mostrar el contenido de ejemplo
    setTimeout(() => {
      spacesData.forEach(space => {
        this.treeControl.expand(space);
      });
    }, 100);
  }

  hasChild = (_: number, node: SpaceNode) => !!node.children && node.children.length > 0;

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

  onNodeClick(node: SpaceNode) {
    console.log('Nodo clickeado:', node);
    // TODO: Implementar lógica para abrir/editar el nodo
  }

  onAddSpace() {
    console.log('Agregar nuevo space para workspace:', this.espacioTrabajoSeleccionado);
    
    const modalRef = this.modalService.open(CreateSpaceComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });

    modalRef.componentInstance.title = 'Create New Space';
    modalRef.componentInstance.espacioTrabajoSeleccionado = this.espacioTrabajoSeleccionado;

    modalRef.result
      .then((spaceData: any) => {
        if (spaceData) {
          console.log('Space creado exitosamente:', spaceData);
          // Recargar spaces después de crear
          this.cargarSpaces();
        }
      })
      .catch(() => {
        console.log('Create space modal dismissed');
      });
  }

  onAddFolder(parentNode: SpaceNode) {
    console.log('Agregar carpeta a:', parentNode);
    // TODO: Implementar agregar carpeta
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
}
