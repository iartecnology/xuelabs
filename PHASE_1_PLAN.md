# Plan de Implementación - Fase 1

## Funcionalidades a Implementar

### 1. Tareas Completas (Assignments)
**Estado actual**: Componente básico existe pero sin funcionalidad de entrega
**Pendiente**:
- [ ] Subida de archivos
- [ ] Editor de texto para entregas
- [ ] Ver retroalimentación del profesor
- [ ] Ver calificación
- [ ] Reenviar tarea
- [ ] Estados de entrega (No entregado, Entregado, Calificado)

**APIs necesarias**:
- `mod_assign_get_assignments` ✅ (ya existe)
- `mod_assign_get_submission_status` (nuevo)
- `mod_assign_save_submission` (nuevo)
- `core_files_upload` (nuevo)

**Archivos a modificar**:
- `src/app/components/assignment-viewer/assignment-viewer.ts`
- `src/app/components/assignment-viewer/assignment-viewer.html`
- `src/app/components/assignment-viewer/assignment-viewer.css`
- `src/app/services/moodle.ts`

---

### 2. Calificaciones (Grades)
**Estado actual**: No implementado
**Pendiente**:
- [ ] Vista de calificaciones del curso
- [ ] Calificaciones por actividad
- [ ] Retroalimentación del profesor
- [ ] Cálculo de promedio
- [ ] Gráfico de progreso

**APIs necesarias**:
- `gradereport_user_get_grade_items` (nuevo)
- `core_grades_get_grades` (nuevo)

**Archivos a crear**:
- `src/app/components/grades-viewer/grades-viewer.ts`
- `src/app/components/grades-viewer/grades-viewer.html`
- `src/app/components/grades-viewer/grades-viewer.css`

**Archivos a modificar**:
- `src/app/services/moodle.ts`
- `src/app/app.routes.ts`
- `src/app/components/course-viewer/course-viewer.html` (añadir botón de calificaciones)

---

### 3. Foros (Forums)
**Estado actual**: Se muestran en iframe
**Pendiente**:
- [ ] Vista de discusiones del foro
- [ ] Crear nueva discusión
- [ ] Responder a discusiones
- [ ] Ver posts anidados
- [ ] Adjuntar archivos (opcional para Fase 1)

**APIs necesarias**:
- `mod_forum_get_forums_by_courses` ✅ (ya existe)
- `mod_forum_get_forum_discussions` ✅ (ya existe)
- `mod_forum_get_discussion_posts` (nuevo)
- `mod_forum_add_discussion` (nuevo)
- `mod_forum_add_discussion_post` (nuevo)

**Archivos a crear**:
- `src/app/components/forum-viewer/forum-viewer.ts`
- `src/app/components/forum-viewer/forum-viewer.html`
- `src/app/components/forum-viewer/forum-viewer.css`

**Archivos a modificar**:
- `src/app/services/moodle.ts`
- `src/app/components/course-viewer/course-viewer.ts` (detectar foros y usar componente)

---

### 4. Notificaciones (Notifications)
**Estado actual**: No implementado
**Pendiente**:
- [ ] Centro de notificaciones
- [ ] Lista de notificaciones recientes
- [ ] Marcar como leído
- [ ] Contador de no leídas
- [ ] Icono en navbar

**APIs necesarias**:
- `message_popup_get_popup_notifications` (nuevo)
- `core_message_mark_all_notifications_as_read` (nuevo)

**Archivos a crear**:
- `src/app/components/notifications/notifications.ts`
- `src/app/components/notifications/notifications.html`
- `src/app/components/notifications/notifications.css`

**Archivos a modificar**:
- `src/app/services/moodle.ts`
- `src/app/components/sidebar/sidebar.html` (añadir icono de notificaciones)
- `src/app/components/sidebar/sidebar.ts`

---

## Orden de Implementación

### Día 1-2: Calificaciones (más simple, sin subida de archivos)
1. Crear componente grades-viewer
2. Añadir APIs de calificaciones en moodle.ts
3. Crear ruta y enlace desde course-viewer
4. Diseñar UI con tabla de calificaciones

### Día 3-5: Tareas Completas (más complejo, requiere file upload)
1. Mejorar assignment-viewer existente
2. Añadir APIs de submission y upload
3. Implementar subida de archivos
4. Añadir editor de texto
5. Mostrar estados y retroalimentación

### Día 6-8: Foros (complejidad media)
1. Crear componente forum-viewer
2. Añadir APIs de foros
3. Vista de discusiones
4. Crear y responder posts
5. Integrar con course-viewer

### Día 9-10: Notificaciones (más simple)
1. Crear componente notifications
2. Añadir APIs de notificaciones
3. Icono en sidebar con contador
4. Vista de lista de notificaciones
5. Marcar como leído

---

## Estimación de Tiempo
- **Calificaciones**: 8-10 horas
- **Tareas**: 15-20 horas
- **Foros**: 12-15 horas
- **Notificaciones**: 6-8 horas
- **Total**: 41-53 horas (~2 semanas de trabajo)

---

## Prioridad de Inicio
Comenzaré con **Calificaciones** porque:
1. Es la más solicitada por usuarios
2. No requiere file upload (más simple)
3. Proporciona valor inmediato
4. Sirve de base para el patrón de otros componentes
