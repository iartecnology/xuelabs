# Implementación de Tareas Completas

## 🎯 Objetivo
Mejorar el `assignment-viewer` existente para que tenga funcionalidad completa de entregas, igual que la app móvil de Moodle.

## 📋 Funcionalidades a Implementar

### 1. Vista de Tarea
- ✅ Descripción de la tarea (ya existe)
- ✅ Fecha de entrega
- ✅ Archivos adjuntos del profesor
- ✅ Estado de entrega (No entregado, Entregado, Calificado)
- ✅ Calificación (si ya fue calificada)
- ✅ Retroalimentación del profesor

### 2. Formulario de Entrega
- 📝 Editor de texto para entrega online
- 📎 Subida de archivos
- 💾 Guardar borrador
- ✅ Enviar entrega
- 🔄 Reenviar (si está permitido)

### 3. Estados de la Tarea
- ⏳ **No entregado**: Mostrar formulario de entrega
- ✅ **Entregado**: Mostrar entrega con opción de editar
- 📊 **Calificado**: Mostrar calificación y feedback
- ⏰ **Retrasado**: Indicador visual si pasó la fecha

## 🔧 APIs de Moodle Necesarias

```typescript
// Ya existe:
- mod_assign_get_assignments

// A añadir:
- mod_assign_get_submission_status  // Estado de entrega
- mod_assign_save_submission        // Guardar entrega
- mod_assign_submit_for_grading     // Enviar para calificar
- core_files_upload                 // Subir archivos (si es necesario)
```

## 📁 Archivos a Modificar

1. `/src/app/components/assignment-viewer/assignment-viewer.ts`
2. `/src/app/components/assignment-viewer/assignment-viewer.html`
3. `/src/app/components/assignment-viewer/assignment-viewer.css`
4. `/src/app/services/moodle.ts` (añadir nuevas APIs)

## 🎨 Diseño de UI

### Estados Visuales:
```
┌─────────────────────────────────────┐
│ 📝 Nombre de la Tarea              │
│ ⏰ Fecha límite: DD/MM/YYYY HH:MM  │
│ 📊 Estado: [Badge]                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📋 Descripción                     │
│ [HTML formateado]                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📎 Archivos del Profesor           │
│ • archivo1.pdf                     │
│ • archivo2.docx                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✍️ Tu Entrega                      │
│                                     │
│ [Si no entregado]                  │
│ ┌─────────────────────────────┐   │
│ │ Texto de entrega            │   │
│ │ [Editor de texto]           │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ Archivos                    │   │
│ │ [Área de subida]            │   │
│ └─────────────────────────────┘   │
│ [Guardar Borrador] [Enviar]       │
│                                     │
│ [Si entregado]                     │
│ ✅ Entregado el: DD/MM/YYYY        │
│ 📄 Archivos entregados:            │
│ • mi_archivo.pdf                   │
│ 📝 Texto entregado:                │
│ [Mostrar texto]                    │
│ [Editar Entrega]                   │
│                                     │
│ [Si calificado]                    │
│ 🌟 Calificación: 95/100            │
│ 💬 Retroalimentación:              │
│ [Feedback del profesor]            │
└─────────────────────────────────────┘
```

## 🚀 Plan de Implementación

### Paso 1: APIs en moodle.ts
```typescript
getSubmissionStatus(assignId: number): Observable<any>
saveSubmission(assignId: number, text: string, files?: any[]): Observable<any>
submitForGrading(assignId: number): Observable<any>
```

### Paso 2: Mejorar assignment-viewer.ts
- Añadir propiedades para estado de entrega
- Añadir métodos para guardar y enviar
- Gestión de archivos
- Editor de texto

### Paso 3: Actualizar HTML
- Formulario de entrega
- Vista de entrega existente
- Vista de calificación

### Paso 4: Estilos Premium
- Estados visuales claros
- Animaciones
- Responsive

## ⚠️ Consideraciones

1. **Subida de archivos**: Moodle requiere un proceso de 2 pasos:
   - Subir archivo a área de borrador
   - Asociar archivo con la entrega

2. **Tipos de entrega**: Moodle soporta:
   - Solo texto online
   - Solo archivos
   - Texto + archivos
   - Necesitamos detectar qué permite la tarea

3. **Permisos**: Verificar si se puede reenviar

## 📊 Estimación
- **Tiempo**: 3-4 horas para versión completa
- **Complejidad**: Alta (subida de archivos es compleja)

## 🎯 Versión Mínima Viable (para esta sesión)
Si el tiempo es limitado, implementar:
1. ✅ Ver estado de entrega
2. ✅ Entrega de texto online
3. ✅ Ver calificación y feedback
4. ⏳ Subida de archivos (dejar para siguiente sesión)

---

**Comenzaré con la implementación ahora...**
