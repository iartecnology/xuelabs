# LearnHub - Modern LMS Interface

Una interfaz moderna de Learning Management System (LMS) conectada con Moodle, construida con Angular.

## 🎨 Características

- **Dashboard Interactivo**: Visualización de cursos con progreso en tiempo real
- **Conexión API Moodle**: Integración completa con servidores Moodle ✅
- **Diseño Moderno**: Glassmorphism, gradientes sutiles y animaciones elegantes
- **Responsive**: Adaptable a dispositivos móviles, tablets y desktop 📱
- **Widgets Funcionales**: Calendario, actividades recientes y más

## 📚 Documentación

- **[API_IMPLEMENTATION.md](./API_IMPLEMENTATION.md)** - Detalles de la implementación de la API
- **[MOODLE_SETUP.md](./MOODLE_SETUP.md)** - Guía completa de configuración de Moodle
- **[TESTING.md](./TESTING.md)** - Guía de testing y servidores de prueba
- **[RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md)** - Documentación del diseño responsivo 📱

## ⚡ Quick Start

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

La aplicación estará disponible en `http://localhost:4200`

## 🔧 Configuración de Moodle

### Paso 1: Habilitar Servicios Web en Moodle

1. Inicia sesión como administrador en tu sitio Moodle
2. Ve a **Administración del sitio > Plugins > Servicios web > Gestionar servicios**
3. Haz clic en **Añadir** para crear un nuevo servicio
4. Configura:
   - Nombre: `LearnHub API`
   - Nombre corto: `learnhub`
   - Habilitado: ✅

### Paso 2: Agregar Funciones al Servicio

En el servicio que creaste, agrega estas funciones:

- `core_webservice_get_site_info`
- `core_enrol_get_users_courses`
- `core_course_get_contents`
- `core_calendar_get_calendar_events`

### Paso 3: Generar Token

1. Ve a **Administración del sitio > Plugins > Servicios web > Gestionar tokens**
2. Haz clic en **Añadir**
3. Selecciona:
   - Usuario: Tu usuario
   - Servicio: `LearnHub API`
4. Copia el token generado

### Paso 4: Configurar en LearnHub

1. Abre LearnHub en tu navegador
2. Ve a **Conexión API** en el sidebar
3. Ingresa:
   - **URL del Servidor**: `https://tu-moodle.com` (sin `/` al final)
   - **Token**: El token que copiaste
4. Haz clic en **Guardar y Probar Conexión**

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/          # Vista principal
│   │   ├── sidebar/            # Navegación lateral
│   │   ├── course-card/        # Tarjeta de curso
│   │   ├── api-config/         # Configuración API
│   │   ├── calendar/           # Widget de calendario
│   │   └── recent-activities/  # Actividades recientes
│   ├── services/
│   │   └── moodle.ts          # Servicio de API Moodle
│   └── app.routes.ts          # Rutas de la aplicación
└── styles.css                  # Estilos globales
```

## 🎯 Uso

### Modo Demo (Sin Conexión)
Si no configuras la conexión con Moodle, la aplicación mostrará datos de ejemplo para que puedas explorar la interfaz.

### Modo Conectado
Una vez configurada la conexión:
- El dashboard mostrará tus cursos reales de Moodle
- El nombre de usuario se actualizará automáticamente
- Los datos se sincronizarán con tu servidor Moodle

## 🔐 Seguridad

- El token se almacena localmente en `localStorage`
- Todas las peticiones usan HTTPS (asegúrate de que tu Moodle use HTTPS)
- No se almacenan contraseñas, solo tokens de API

## 🛠️ Desarrollo

### Comandos Disponibles

```bash
# Desarrollo
npm start

# Build de producción
npm run build

# Linting
npm run lint
```

### Personalización

#### Cambiar Colores

Edita `src/styles.css`:

```css
:root {
  --primary-color: #0f172a;
  --accent-color: #3b82f6;
  /* ... más variables */
}
```

#### Agregar Nuevas Funciones de Moodle

Edita `src/app/services/moodle.ts` y agrega nuevos métodos:

```typescript
getAssignments(): Observable<any> {
  return this.callMoodleFunction('mod_assign_get_assignments', {}, this.configSubject.value!);
}
```

## 📝 Notas

- **CORS**: Si tienes problemas de CORS, asegúrate de que tu servidor Moodle permita peticiones desde `http://localhost:4200`
- **HTTPS**: Moodle debe estar en HTTPS para producción
- **Permisos**: El usuario debe tener permisos para acceder a los servicios web

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🆘 Soporte

Si encuentras algún problema:

1. Verifica que tu servidor Moodle esté configurado correctamente
2. Revisa la consola del navegador para errores
3. Asegúrate de que el token sea válido
4. Verifica que las funciones de API estén habilitadas en Moodle

---

Desarrollado con ❤️ usando Angular
