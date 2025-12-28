# Cómo Habilitar Contenido Integrado (Iframe) en Moodle

Actualmente, tu servidor Moodle (`xueturismo.com`) está configurado para **bloquear** que otros sitios (incluido tu entorno local localhost) muestren su contenido dentro de un marco (iframe). Esto es una medida de seguridad por defecto llamada `X-Frame-Options: SAMEORIGIN`.

Para que la aplicación XUe Labs pueda mostrar las actividades (H5P, Cuestionarios, etc.) **dentro** de la interfaz sin abrir nuevas ventanas, debes cambiar una configuración en tu Moodle.

## Pasos para el Administrador de Moodle

1.  Inicia sesión en tu Moodle como **Administrador**.
2.  Ve a **Administración del sitio** > **Seguridad** > **Seguridad HTTP**.
3.  Busca la opción **"Permitir ser incrustado en marcos"** (Allow frame embedding).
4.  **Activa** esta casilla (Check).
5.  Guarda los cambios al final de la página.

### Alternativa Avanzada (Si tienes acceso al servidor web)
Si no quieres habilitarlo globalmente, puedes configurar tu servidor web (Apache/Nginx) para enviar el encabezado `Content-Security-Policy` permitiendo tu dominio de desarrollo:

`Content-Security-Policy: frame-ancestors 'self' http://localhost:4200 https://tudominioapp.com;`

## Resultado
Una vez hecho esto, recarga la aplicación. Las tarjetas de "Actividad Interactiva" podrán ser reemplazadas por la actividad real incrustada.
