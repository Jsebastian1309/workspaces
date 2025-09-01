# Worki - Gestor de Tareas Inteligente

**Worki** es un sistema completo de gestión de tareas y proyectos desarrollado en Angular, diseñado para organizaciones que necesitan una herramienta poderosa y flexible para administrar su trabajo de manera eficiente.

## 🚀 Características Principales

### Estructura Jerárquica Organizacional
Worki utiliza una arquitectura organizacional de 5 niveles que permite una organización clara y escalable:

```
📋 Espacio de Trabajo (Workspace)
  └── 🏢 Espacio (Space)
      └── 📁 Carpeta (Folder)
          └── 📝 Lista (List)
              └── ✅ Tarea (Task)
```

### Vistas Múltiples de Gestión
- **📋 Vista de Lista**: Gestión tradicional de tareas con columnas por estado
- **📅 Vista de Calendario**: Visualización temporal de tareas y deadlines
- **📊 Vista Gantt**: Planificación y seguimiento de proyectos con dependencias

### Gestión Avanzada de Tareas
- ✅ **Estados personalizables**: Abierto, En progreso, Bloqueado, Completado
- 🎯 **Prioridades**: Baja, Media, Alta
- 👥 **Asignación de equipos**: Colaboración multi-usuario
- 📝 **Comentarios y descripción detallada**
- ⏱️ **Seguimiento de tiempo** con duración en horas
- 🏷️ **Etiquetas y categorización**
- 📈 **Progreso visual** con porcentajes

### Colaboración y Equipos
- 👥 **Gestión de equipos** y asignación de miembros
- 🔐 **Sistema de autenticación** con JWT
- 👤 **Perfiles de usuario** personalizados
- 📧 **Bandeja de entrada** para notificaciones

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Angular 16.2 + TypeScript
- **UI/UX**: Angular Material + Bootstrap 5 + Bootstrap Icons
- **Autenticación**: JWT (@auth0/angular-jwt)
- **Internacionalización**: ngx-translate
- **Calendario**: angular-calendar + date-fns
- **Gantt**: @worktile/gantt
- **Visuales**: html2canvas para capturas
- **UUID**: Generación de identificadores únicos

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn
- Angular CLI 16.2.16

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/Jsebastian1309/workspaces.git
cd workspaces

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

La aplicación estará disponible en `http://localhost:4200/`

## 🏗️ Arquitectura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── core/           # Componentes base (header, sidebar, spaces-tree)
│   │   ├── pages/          # Páginas principales (home, login, task, etc.)
│   │   ├── views/          # Vistas de tareas (list, calendar, gantt)
│   │   ├── modals/         # Modales reutilizables
│   │   └── shared/         # Componentes compartidos
│   ├── models/             # Interfaces y modelos de datos
│   ├── service/
│   │   ├── core/           # Servicios base (auth, etc.)
│   │   └── features/       # Servicios por funcionalidad
│   └── app-routing.module.ts
```

## 🎯 Funcionalidades por Módulo

### 🏢 Gestión de Espacios de Trabajo
- Creación y edición de workspaces
- Organización jerárquica de espacios
- Configuración de permisos por workspace

### 📁 Administración de Carpetas y Listas
- Creación de carpetas temáticas
- Listas personalizables por carpeta
- Templates de estado configurables

### ✅ Gestión de Tareas
- Creación rápida con formularios intuitivos
- Edición en línea de propiedades
- Drag & drop entre estados
- Filtros avanzados por fecha, prioridad, asignado
- Búsqueda en tiempo real

### 👥 Gestión de Equipos
- Creación y administración de equipos
- Asignación de tareas a miembros
- Seguimiento de carga de trabajo

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm start          # Servidor de desarrollo
npm run watch      # Build en modo watch

# Producción
npm run build      # Build para producción

# Testing
npm test           # Ejecutar tests unitarios

# Angular CLI
ng generate component nombre-componente
ng generate service nombre-servicio
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno
Configurar las variables necesarias para conectar con el backend:
- API endpoints
- Configuración de autenticación
- URLs de servicios externos

### Estructura de Estados de Tarea
```typescript
interface Task {
  identificador: string;
  nombre: string;
  descripcion?: string;
  estado?: string;           // OPEN, PENDING, BLOCKED, DONE
  prioridad?: string;        // Low, Medium, High
  asignadoA?: string;
  fechaVencimiento?: Date;
  progreso?: number;         // 0-100
  duracionHoras?: number;
  // ... más propiedades
}
```

## 🎨 Personalización

### Temas y Estilos
- Modificar variables CSS en `src/styles.scss`
- Personalizar temas de Angular Material
- Configurar colores de Bootstrap

### Templates de Estado
- Configurar estados personalizados por proyecto
- Definir flujos de trabajo específicos
- Crear plantillas reutilizables

## 🤝 Contribución

1. Fork el repositorio
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit los cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

## 👨‍💻 Desarrollado por

**Jsebastian1309** - [GitHub](https://github.com/Jsebastian1309)

---

## 📚 Documentación Técnica de Angular

Este proyecto fue generado con [Angular CLI](https://github.com/angular/angular-cli) versión 16.2.16.

### Comandos de Angular CLI

#### Servidor de Desarrollo
```bash
ng serve
```
Navegar a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias archivos fuente.

#### Generación de Código
```bash
ng generate component component-name
ng generate directive|pipe|service|class|guard|interface|enum|module
```

#### Build
```bash
ng build
```
Los artefactos de build se almacenarán en el directorio `dist/`.

#### Tests Unitarios
```bash
ng test
```
Ejecutar tests unitarios via [Karma](https://karma-runner.github.io).

#### Tests End-to-End
```bash
ng e2e
```
Ejecutar tests e2e vía la plataforma de tu elección. Para usar este comando, primero necesitas agregar un paquete que implemente capacidades de testing e2e.

#### Ayuda Adicional
Para obtener más ayuda sobre Angular CLI usa `ng help` o revisa la [Angular CLI Overview and Command Reference](https://angular.io/cli).
