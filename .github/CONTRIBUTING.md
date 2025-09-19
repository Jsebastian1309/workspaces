# Guía de Contribución

¡Gracias por tu interés en contribuir a Worki! 

## 🚀 Cómo Empezar

1. **Fork el repositorio** en GitHub
2. **Clona tu fork** localmente:
   ```bash
   git clone https://github.com/tu-usuario/workspaces.git
   cd workspaces
   ```
3. **Instala las dependencias**:
   ```bash
   npm install
   ```
4. **Crea una rama para tu feature**:
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```

## 🎯 Tipos de Contribuciones

### 🐛 Reportar Bugs
- Usa el template de issue para bugs
- Incluye pasos para reproducir el problema
- Adjunta capturas de pantalla si es visual

### ✨ Nuevas Funcionalidades
- Discute la idea primero en un issue
- Sigue los patrones de arquitectura existentes
- Incluye tests para nueva funcionalidad

### 📚 Documentación
- Mejoras al README
- Comentarios en código
- Guías de usuario

## 🛠️ Estándares de Código

### TypeScript/Angular
- Usa tipos estrictos de TypeScript
- Sigue las convenciones de Angular Style Guide
- Usa nombres descriptivos para componentes y servicios

### Estructura de Commits
```
tipo(scope): descripción breve

Descripción más detallada si es necesaria.

- Cambio específico 1
- Cambio específico 2
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📝 Proceso de Pull Request

1. **Actualiza tu rama** con main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Ejecuta tests**:
   ```bash
   npm test
   npm run build
   ```

3. **Crea el Pull Request**:
   - Título descriptivo
   - Descripción clara de los cambios
   - Referencias a issues relacionados

## 🚨 Issues y Bugs

### Información Requerida
- **Versión** del navegador
- **Pasos** para reproducir
- **Comportamiento esperado** vs **actual**
- **Capturas de pantalla** si aplica
- **Logs de consola** si hay errores

¡Gracias por contribuir a Worki! 🎉