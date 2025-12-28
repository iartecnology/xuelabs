# Ejemplo de Configuración para Testing

## 🧪 Servidor de Prueba Moodle

Si quieres probar la integración sin configurar tu propio servidor Moodle, puedes usar estos servidores de demostración públicos:

### Opción 1: Moodle Sandbox (Recomendado)
```
URL: https://sandbox.moodledemo.net
Usuario: teacher / student
Contraseña: sandbox
```

**Nota**: Este servidor se resetea cada hora, por lo que necesitarás generar un nuevo token cada vez.

### Opción 2: Moodle School Demo
```
URL: https://school.moodledemo.net
Usuario: Disponible en el sitio
```

## 🔑 Generar Token en Servidor de Prueba

### Pasos:

1. **Inicia sesión** en el servidor de prueba
2. Ve a tu **Perfil de usuario** (esquina superior derecha)
3. Selecciona **Preferencias**
4. Busca **Tokens de seguridad** o **Security keys**
5. Haz clic en **Crear token**
6. Selecciona el servicio (si está disponible)
7. Copia el token generado

## 📝 Configuración de Ejemplo

### Configuración Básica
```json
{
  "url": "https://sandbox.moodledemo.net",
  "token": "tu_token_aqui",
  "autoConnect": true
}
```

### Configuración Local (Desarrollo)
```json
{
  "url": "http://localhost:8080",
  "token": "tu_token_local",
  "autoConnect": false
}
```

### Configuración Producción
```json
{
  "url": "https://moodle.tuescuela.edu",
  "token": "token_produccion_seguro",
  "autoConnect": true
}
```

## 🧪 Testing Manual

### Test 1: Verificar Conexión
```bash
curl "https://sandbox.moodledemo.net/webservice/rest/server.php?wstoken=TU_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

**Respuesta esperada**:
```json
{
  "sitename": "Moodle Sandbox",
  "username": "teacher",
  "firstname": "Teacher",
  "lastname": "User",
  ...
}
```

### Test 2: Obtener Cursos
```bash
curl "https://sandbox.moodledemo.net/webservice/rest/server.php?wstoken=TU_TOKEN&wsfunction=core_enrol_get_users_courses&userid=0&moodlewsrestformat=json"
```

**Respuesta esperada**:
```json
[
  {
    "id": 1,
    "fullname": "Course 1",
    "shortname": "C1",
    ...
  }
]
```

## 🔧 Configuración de Desarrollo Local

### Instalar Moodle con Docker

```bash
# Clonar repositorio
git clone https://github.com/moodlehq/moodle-docker.git
cd moodle-docker

# Iniciar contenedor
export MOODLE_DOCKER_WWWROOT=/path/to/moodle/code
export MOODLE_DOCKER_DB=pgsql
./bin/moodle-docker-compose up -d

# Acceder a Moodle
# http://localhost:8000
```

### Configurar Servicios Web en Docker

1. Accede a `http://localhost:8000`
2. Usuario: `admin`
3. Contraseña: `test`
4. Sigue los pasos de `MOODLE_SETUP.md`

## 🎯 Datos de Prueba

### Usuario de Prueba
```
Nombre: Juan
Apellido: Estudiante
Email: juan@example.com
```

### Cursos de Prueba
```
1. Diseño UX/UI Avanzado (75% completado)
2. Desarrollo Web Full Stack (45% completado)
3. Marketing Digital (90% completado)
4. Gestión de Proyectos (30% completado)
```

### Eventos de Calendario
```
- Examen Final - 15 Dic
- Entrega de Proyecto - 20 Dic
- Presentación - 22 Dic
```

## 🔐 Variables de Entorno (Opcional)

Puedes crear un archivo `.env.local` para desarrollo:

```env
MOODLE_URL=https://sandbox.moodledemo.net
MOODLE_TOKEN=tu_token_aqui
```

Y luego usarlo en tu código:

```typescript
const config = {
  url: process.env['MOODLE_URL'] || 'https://sandbox.moodledemo.net',
  token: process.env['MOODLE_TOKEN'] || '',
  autoConnect: true
};
```

## 📊 Monitoreo de API

### Usar Chrome DevTools

1. Abre **DevTools** (F12)
2. Ve a la pestaña **Network**
3. Filtra por `webservice`
4. Observa las peticiones y respuestas

### Logs en Consola

El servicio Moodle ya incluye logs:

```typescript
console.log('Moodle API Request:', functionName, params);
console.log('Moodle API Response:', response);
console.error('Moodle API Error:', error);
```

## 🚨 Errores Comunes

### Error 1: "accessexception"
```json
{
  "exception": "webservice_access_exception",
  "errorcode": "accessexception"
}
```
**Solución**: Verifica que el servicio web esté habilitado y el usuario tenga permisos.

### Error 2: "invalidtoken"
```json
{
  "exception": "moodle_exception",
  "errorcode": "invalidtoken"
}
```
**Solución**: Regenera el token o verifica que sea correcto.

### Error 3: CORS
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solución**: Configura CORS en Moodle o usa un proxy.

## 🎓 Recursos Adicionales

- [Moodle Demo Sites](https://moodle.org/demo/)
- [Moodle Docker](https://github.com/moodlehq/moodle-docker)
- [Web Services Documentation](https://docs.moodle.org/en/Web_services)
- [API Testing Tools](https://www.postman.com/)

---

**Nota**: Los servidores de demostración son públicos y se resetean regularmente. No uses datos sensibles en ellos.
