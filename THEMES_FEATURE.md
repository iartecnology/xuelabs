# 🎨 Nueva Funcionalidad: Temas Personalizables

Ahora puedes cambiar el color principal de la plataforma desde la configuración.

## 🛠 Cómo funciona
El sistema utiliza variables CSS nativas (`--primary-50` a `--primary-900`) que se actualizan dinámicamente en el `:root` del documento.

## 🌈 Temas Disponibles
1. **Violeta (Original):** El clásico color de marca.
2. **Azul Océano:** Estilo corporativo y limpio.
3. **Verde Esmeralda:** Fresco y relajante.
4. **Rosa Intenso:** Vibrante y energético.
5. **Ámbar:** Cálido y amigable.
6. **Gris Ejecutivo:** Minimalista y serio.

## ⚙️ Uso
1. Ve a `/config` (Menú > Configuración).
2. Selecciona un color en la tarjeta "Personalización".
3. El cambio es inmediato y se guarda en tu navegador.

## 💻 Detalles Técnicos
- **Servicio:** `ThemeService` (`src/app/services/theme.ts`) maneja la lógica y persistencia.
- **Estilos:** `styles.css` actualizado para usar variables dinámicas en botones y componentes globales.
- **Persistencia:** `localStorage` guarda tu preferencia entre sesiones.
