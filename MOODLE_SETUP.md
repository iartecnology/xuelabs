# Guía de Configuración de Moodle para LearnHub

## 📋 Requisitos Previos

- Acceso de administrador a tu sitio Moodle
- Moodle versión 3.5 o superior
- HTTPS habilitado (recomendado para producción)

## 🔧 Configuración Paso a Paso

### 1. Habilitar Servicios Web

#### 1.1 Activar Servicios Web
```
Administración del sitio > Avanzadas > Características avanzadas
✅ Habilitar servicios web
```

#### 1.2 Habilitar Protocolos REST
```
Administración del sitio > Plugins > Servicios web > Gestionar protocolos
✅ Habilitar REST protocol
```

### 2. Crear Servicio Web Personalizado

```
Administración del sitio > Plugins > Servicios web > Servicios externos
```

Haz clic en **Añadir** y configura:

- **Nombre**: LearnHub API
- **Nombre corto**: learnhub_api
- **Habilitado**: ✅
- **Usuarios autorizados**: Selecciona los usuarios que podrán usar este servicio
- **Descargar archivos**: ✅ (opcional)
- **Subir archivos**: ✅ (opcional)

### 3. Agregar Funciones al Servicio

Después de crear el servicio, haz clic en **Funciones** y agrega:

#### Funciones Básicas (Requeridas)
- `core_webservice_get_site_info` - Información del sitio
- `core_enrol_get_users_courses` - Obtener cursos del usuario

#### Funciones Adicionales (Recomendadas)
- `core_course_get_contents` - Contenido de cursos
- `core_course_get_courses` - Lista de cursos
- `core_calendar_get_calendar_events` - Eventos del calendario
- `core_user_get_users_by_field` - Información de usuarios
- `mod_assign_get_assignments` - Tareas
- `mod_forum_get_forums_by_courses` - Foros
- `core_message_get_messages` - Mensajes

### 4. Crear Rol Personalizado (Opcional pero Recomendado)

```
Administración del sitio > Usuarios > Permisos > Definir roles
```

Crea un nuevo rol llamado "LearnHub User" con estos permisos:

- `webservice/rest:use` - Usar protocolo REST
- `moodle/webservice:createtoken` - Crear tokens

### 5. Generar Token de Usuario

#### Opción A: Token Manual (Administrador)
```
Administración del sitio > Plugins > Servicios web > Gestionar tokens
```

1. Haz clic en **Añadir**
2. Selecciona:
   - **Usuario**: El usuario que usará LearnHub
   - **Servicio**: learnhub_api
   - **Fecha de expiración**: (opcional)
3. Guarda y copia el token generado

#### Opción B: Auto-generación de Token (Usuario)
```
Perfil de usuario > Preferencias > Tokens de seguridad
```

El usuario puede generar su propio token si tiene los permisos necesarios.

### 6. Configurar CORS (Si es necesario)

Si LearnHub está en un dominio diferente a Moodle:

```
Administración del sitio > Seguridad > Seguridad HTTP
```

En **Permitir CORS**, agrega:
```
http://localhost:4200
https://tu-dominio-learnhub.com
```

### 7. Verificar Configuración

Puedes probar la API directamente en el navegador:

```
https://tu-moodle.com/webservice/rest/server.php?wstoken=05c991de502797a9957bb1863571a868&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json
```

Si ves un JSON con información del sitio, ¡la configuración es correcta! ✅

## 🔐 Seguridad

### Mejores Prácticas

1. **Usar HTTPS**: Siempre en producción
2. **Tokens con Expiración**: Configura fechas de expiración
3. **Permisos Mínimos**: Solo agrega las funciones necesarias
4. **Auditoría**: Revisa regularmente los tokens activos
5. **IP Restriction**: Limita acceso por IP si es posible

### Revocar Tokens

```
Administración del sitio > Plugins > Servicios web > Gestionar tokens
```

Busca el token y haz clic en **Eliminar**.

## 🐛 Solución de Problemas

### Error: "Access control exception"
**Solución**: Verifica que el servicio web esté habilitado y el usuario tenga permisos.

### Error: "Invalid token"
**Solución**: Regenera el token y asegúrate de copiarlo correctamente.

### Error: "Function not found"
**Solución**: Agrega la función faltante al servicio web.

### Error: "CORS policy"
**Solución**: Configura CORS en Moodle o usa un proxy.

### Error: "Invalid parameter value detected"
**Solución**: Verifica que los parámetros enviados sean correctos.

## 📊 Funciones Disponibles en Moodle

### Cursos
- `core_enrol_get_users_courses` - Cursos del usuario
- `core_course_get_contents` - Contenido del curso
- `core_course_get_categories` - Categorías de cursos

### Usuarios
- `core_user_get_users_by_field` - Buscar usuarios
- `core_user_get_course_user_profiles` - Perfiles de usuarios

### Calendario
- `core_calendar_get_calendar_events` - Eventos
- `core_calendar_create_calendar_events` - Crear eventos

### Tareas
- `mod_assign_get_assignments` - Lista de tareas
- `mod_assign_get_submissions` - Envíos de tareas
- `mod_assign_submit_for_grading` - Enviar tarea

### Foros
- `mod_forum_get_forums_by_courses` - Foros del curso
- `mod_forum_get_forum_discussions` - Discusiones
- `mod_forum_add_discussion_post` - Agregar post

### Mensajes
- `core_message_get_messages` - Obtener mensajes
- `core_message_send_instant_messages` - Enviar mensajes

## 🔗 Referencias

- [Documentación oficial de Moodle Web Services](https://docs.moodle.org/en/Web_services)
- [Lista completa de funciones API](https://docs.moodle.org/dev/Web_service_API_functions)
- [Guía de seguridad](https://docs.moodle.org/en/Web_services_security)

---

**Nota**: Esta guía está basada en Moodle 4.x. Algunas opciones pueden variar en versiones anteriores.
