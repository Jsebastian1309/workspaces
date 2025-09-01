# Guía de Instalación y Configuración - Worki

## Prerrequisitos del Sistema

### Software Requerido
- **Node.js**: versión 16.x o superior
- **npm**: versión 8.x o superior (incluido con Node.js)
- **Git**: para clonar el repositorio
- **Angular CLI**: versión 16.2.16

### Navegadores Soportados
- Chrome (recomendado)
- Firefox
- Safari
- Edge

## Instalación Paso a Paso

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Jsebastian1309/workspaces.git
cd workspaces
```

### 2. Instalar Angular CLI (si no está instalado)
```bash
npm install -g @angular/cli@16.2.16
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Configuración del Entorno

#### Variables de Entorno
Crear archivo `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  authUrl: 'http://localhost:3000/auth',
  appName: 'Worki',
  version: '1.0.0'
};
```

#### Configuración de Producción
Crear archivo `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-api.com/api',
  authUrl: 'https://tu-api.com/auth',
  appName: 'Worki',
  version: '1.0.0'
};
```

### 5. Iniciar el Servidor de Desarrollo
```bash
npm start
# o
ng serve
```

La aplicación estará disponible en `http://localhost:4200/`

## Configuración del Backend

### API Endpoints Requeridos
La aplicación espera los siguientes endpoints:

#### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/verify` - Verificar token

#### Workspaces
- `GET /api/workspaces` - Listar workspaces
- `POST /api/workspaces` - Crear workspace
- `PUT /api/workspaces/:id` - Actualizar workspace
- `DELETE /api/workspaces/:id` - Eliminar workspace

#### Espacios
- `GET /api/spaces` - Listar espacios
- `POST /api/spaces` - Crear espacio
- `PUT /api/spaces/:id` - Actualizar espacio
- `DELETE /api/spaces/:id` - Eliminar espacio

#### Carpetas
- `GET /api/folders` - Listar carpetas
- `POST /api/folders` - Crear carpeta
- `PUT /api/folders/:id` - Actualizar carpeta
- `DELETE /api/folders/:id` - Eliminar carpeta

#### Listas
- `GET /api/lists` - Listar listas
- `POST /api/lists` - Crear lista
- `PUT /api/lists/:id` - Actualizar lista
- `DELETE /api/lists/:id` - Eliminar lista

#### Tareas
- `GET /api/tasks` - Listar tareas
- `POST /api/tasks` - Crear tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea

#### Equipos
- `GET /api/teams` - Listar equipos
- `POST /api/teams` - Crear equipo
- `PUT /api/teams/:id` - Actualizar equipo
- `DELETE /api/teams/:id` - Eliminar equipo

## Configuración de Base de Datos

### Estructura de Datos Recomendada

#### Tabla: workspaces
```sql
CREATE TABLE workspaces (
  id SERIAL PRIMARY KEY,
  identificador VARCHAR(255) UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: spaces
```sql
CREATE TABLE spaces (
  id SERIAL PRIMARY KEY,
  identificador VARCHAR(255) UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  workspace_id VARCHAR(255) REFERENCES workspaces(identificador),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: folders
```sql
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  identificador VARCHAR(255) UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  space_id VARCHAR(255) REFERENCES spaces(identificador),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: lists
```sql
CREATE TABLE lists (
  id SERIAL PRIMARY KEY,
  identificador VARCHAR(255) UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  folder_id VARCHAR(255) REFERENCES folders(identificador),
  template_estado_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: tasks
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  identificador VARCHAR(255) UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(50) DEFAULT 'OPEN',
  prioridad VARCHAR(20) DEFAULT 'Medium',
  progreso INTEGER DEFAULT 0,
  fecha_inicio DATE,
  fecha_fin DATE,
  fecha_vencimiento DATE,
  duracion_horas INTEGER DEFAULT 0,
  asignado_a VARCHAR(255),
  list_id VARCHAR(255) REFERENCES lists(identificador),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Comandos de Desarrollo

### Servidor de Desarrollo
```bash
npm start          # Inicia en http://localhost:4200
npm run watch      # Build en modo watch
```

### Build y Producción
```bash
npm run build                    # Build para producción
npm run build -- --watch        # Build con watch
ng build --configuration production
```

### Tests
```bash
npm test           # Tests unitarios
npm run test:coverage  # Tests con cobertura
ng e2e             # Tests end-to-end
```

### Linting y Formato
```bash
ng lint            # Ejecutar ESLint
npm run format     # Formatear código
```

## Troubleshooting

### Problemas Comunes

#### Error: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Error de CORS
Configurar proxy en `proxy.conf.json`:
```json
{
  "/api/*": {
    "target": "http://localhost:3000",
    "secure": true,
    "changeOrigin": true
  }
}
```

Iniciar con proxy:
```bash
ng serve --proxy-config proxy.conf.json
```

#### Error de memoria en build
```bash
node --max_old_space_size=8192 node_modules/@angular/cli/bin/ng build
```

### Logs y Debugging
- Abrir DevTools del navegador (F12)
- Revisar Console para errores JavaScript
- Revisar Network para problemas de API
- Usar Angular DevTools extension

## Configuración IDE

### Visual Studio Code
Extensiones recomendadas:
- Angular Language Service
- TypeScript Hero
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

### Configuración de workspace (.vscode/settings.json):
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "angular.experimental-ivy": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

## Despliegue

### Build para Producción
```bash
ng build --prod
```

### Servidor Web
Los archivos en `dist/` pueden servirse con cualquier servidor web:
- Apache
- Nginx
- IIS
- Firebase Hosting
- Netlify
- Vercel