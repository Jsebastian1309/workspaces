# Changelog

Todos los cambios notables a este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Sin liberar]

### Agregado
- README mejorado con descripción completa del proyecto
- Guía de contribución en `.github/CONTRIBUTING.md`
- Documentación de arquitectura y funcionalidades

### Cambiado
- Estructura del README para mejor legibilidad
- Descripción del proyecto de "Proyectos" a "Worki - Gestor de Tareas Inteligente"

## [0.1.0] - Versión Inicial

### Agregado
- Sistema de gestión de tareas con jerarquía: Workspace → Space → Folder → List → Task
- Múltiples vistas: Lista, Calendario, Gantt
- Sistema de autenticación con JWT
- Gestión de equipos y asignación de tareas
- Estados personalizables de tareas
- Prioridades y etiquetas
- Seguimiento de tiempo y progreso
- Comentarios en tareas
- Filtros avanzados
- Internacionalización con ngx-translate
- Interfaz responsive con Angular Material y Bootstrap

### Componentes Principales
- `SpacesTreeComponent` - Navegación jerárquica
- `ListViewComponent` - Vista de lista de tareas
- `CalendarViewComponent` - Vista de calendario
- `GanttViewComponent` - Vista de diagrama Gantt
- `TaskComponent` - Gestión de tareas
- `HomeComponent` - Dashboard principal
- `LoginComponent` - Autenticación

### Servicios
- `AuthService` - Autenticación y autorización
- `TaskService` - Gestión de tareas
- `TeamService` - Gestión de equipos
- `WorkspaceService` - Gestión de espacios de trabajo
- `FolderService` - Gestión de carpetas
- `ListService` - Gestión de listas

### Tecnologías
- Angular 16.2
- TypeScript
- Angular Material
- Bootstrap 5
- @worktile/gantt para diagramas Gantt
- angular-calendar para vista de calendario
- @auth0/angular-jwt para autenticación
- rxjs para programación reactiva