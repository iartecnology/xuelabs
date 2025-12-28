# ✅ Funcionalidad: "Mis Cursos" (Estilo App Móvil)

## 🎯 Objetivo
Replicar la experiencia de navegación de cursos de la app oficial de Moodle, permitiendo al usuario ver, filtrar y buscar sus cursos matriculados de forma eficiente.

## 🛠 Características Implementadas

### 1. **Filtros de Estado (Timeline)**
Igual que en Moodle, puedes filtrar cursos por:
- **Todos**: Muestra todo el historial.
- **En Progreso**: Cursos actuales.
- **Futuros**: Cursos que aún no empiezan.
- **Pasados**: Cursos ya finalizados.
- **Destacados**: Cursos marcados como favoritos (Star).

### 2. **Vistas Flexibles**
- **Vista Tarjeta (Grid):** Visual y atractiva, con imagen de portada grande y barra de progreso. Ideal para explorar.
- **Vista Lista:** Compacta, perfecta para cuando tienes muchos cursos. Muestra miniatura, nombre y progreso.

### 3. **Buscador Instantáneo** 🔍
- Filtra la lista de cursos en tiempo real mientras escribes.
- Busca por nombre completo y nombre corto.

### 4. **Interfaz Premium**
- Diseño limpio y moderno.
- Pestañas de navegación suaves.
- Animaciones de entrada.
- Totalmente responsive (adaptado a móviles).

## 📂 Archivos Nuevos

- `src/app/components/my-courses/my-courses.ts`: Lógica del componente.
- `src/app/components/my-courses/my-courses.html`: Plantilla con pestañas y grid.
- `src/app/components/my-courses/my-courses.css`: Estilos personalizados.

## 🔗 Integración
- **Ruta:** `/courses`
- **Menú:** Accesible desde el Sidebar como "📚 Mis Cursos".

## 🚀 Cómo Probar
1. Haz clic en "📚 Mis Cursos" en el menú lateral.
2. Prueba cambiar entre las pestañas (Todos, En Progreso, etc.).
3. Usa el botón de alternar vista (arriba a la derecha) para cambiar entre lista y tarjetas.
4. Escribe en el buscador para filtrar un curso específico.
