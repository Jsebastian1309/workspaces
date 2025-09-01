# Arquitectura de Worki

## Visión General

Worki es una aplicación de gestión de tareas construida con Angular que implementa una arquitectura jerárquica de 5 niveles para organizar el trabajo de manera eficiente.

## Jerarquía Organizacional

```
📋 Workspace (Espacio de Trabajo)
  │
  ├── 🏢 Space (Espacio)
  │    │
  │    ├── 📁 Folder (Carpeta)
  │    │    │
  │    │    ├── 📝 List (Lista)
  │    │    │    │
  │    │    │    ├── ✅ Task (Tarea)
  │    │    │    ├── ✅ Task (Tarea)
  │    │    │    └── ✅ Task (Tarea)
  │    │    │
  │    │    └── 📝 List (Lista)
  │    │         └── ✅ Task (Tarea)
  │    │
  │    └── 📁 Folder (Carpeta)
  │         └── 📝 List (Lista)
  │              └── ✅ Task (Tarea)
  │
  └── 🏢 Space (Espacio)
       └── 📁 Folder (Carpeta)
            └── 📝 List (Lista)
                 └── ✅ Task (Tarea)
```

## Componentes Principales

### Core Components
- **SpacesTreeComponent**: Navegación jerárquica principal
- **HeaderComponent**: Barra superior con navegación
- **SidebarComponent**: Panel lateral con herramientas

### Page Components
- **HomeComponent**: Dashboard principal
- **LoginComponent**: Autenticación de usuarios
- **TaskComponent**: Gestión de tareas

### View Components
- **ListViewComponent**: Vista de lista tipo Kanban
- **CalendarViewComponent**: Vista de calendario
- **GanttViewComponent**: Vista de diagrama Gantt

### Modal Components
- **ModalTaskComponent**: Edición de tareas
- **ModalWorkspaceComponent**: Gestión de workspaces
- **ModalSpaceComponent**: Gestión de espacios
- **ModalFolderComponent**: Gestión de carpetas

## Servicios

### Core Services
- **AuthService**: Manejo de autenticación JWT
- **UniqueIdService**: Generación de IDs únicos

### Feature Services
- **WorkspaceService**: CRUD de espacios de trabajo
- **SpaceService**: CRUD de espacios
- **FolderService**: CRUD de carpetas
- **ListService**: CRUD de listas
- **TaskService**: CRUD de tareas
- **TeamService**: Gestión de equipos

## Modelos de Datos

### Task Interface
```typescript
interface Task {
  identificador: string;
  nombre: string;
  descripcion?: string;
  estado?: string;          // OPEN, PENDING, BLOCKED, DONE
  prioridad?: string;       // Low, Medium, High
  asignadoA?: string;
  fechaVencimiento?: Date;
  progreso?: number;        // 0-100
  duracionHoras?: number;
  tipoTarea?: string;
  etiqueta?: string;
  comentarios?: string;
}
```

### SpaceNode Interface
```typescript
interface SpaceNode {
  id?: number;
  identificador?: string;
  nombre: string;
  tipo: 'space' | 'folder' | 'list' | 'task';
  folders?: SpaceNode[];
  lists?: SpaceNode[];
  espacioTrabajoIdentificador?: string;
  espacioIdentificador?: string;
  carpetaIdentificador?: string;
}
```

## Flujo de Datos

1. **Autenticación**: El usuario se autentica y recibe un JWT token
2. **Carga de Workspace**: Se cargan los espacios de trabajo del usuario
3. **Navegación Jerárquica**: El usuario navega por la estructura organizacional
4. **Gestión de Tareas**: CRUD operations sobre tareas con estado reactivo
5. **Actualización en Tiempo Real**: Los cambios se reflejan automáticamente

## Patrones de Diseño

- **Component/Service Pattern**: Separación clara entre lógica de negocio y presentación
- **Observable Pattern**: Uso de RxJS para manejo de estado reactivo
- **Hierarchical Navigation**: Navegación basada en estructura de árbol
- **Modal Pattern**: Uso de modales para edición de entidades
- **Template Pattern**: Templates reutilizables para estados de tarea

## Tecnologías de UI

- **Angular Material**: Componentes base
- **Bootstrap 5**: Layout y utilidades CSS
- **Bootstrap Icons**: Iconografía
- **@worktile/gantt**: Diagramas Gantt
- **angular-calendar**: Vista de calendario
- **html2canvas**: Capturas de pantalla