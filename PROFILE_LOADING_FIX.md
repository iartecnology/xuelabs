# 🔧 Corrección: Carga de Perfil "Congelada"

## ❌ Problema Reportado
El usuario indicaba que al entrar al perfil se quedaba "cargando", y solo al hacer clic de nuevo aparecía el contenido.

## 🔍 Diagnóstico
Esto es un síntoma clásico de **Change Detection** en Angular. La respuesta de la API (`getSiteInfo`) llega correctamente, pero Angular no se entera inmediatamente de que debe actualizar la vista para quitar el spinner de carga (`loading = false`), por lo que la UI se queda estática hasta que el usuario interactúa (ej. un clic), lo cual dispara un ciclo de detección.

## ✅ Solución Implementada
Se inyectó `ChangeDetectorRef` en el componente `UserProfile` y se llama a `detectChanges()` manualmente justo después de recibir los datos.

```typescript
// src/app/components/user-profile/user-profile.ts
constructor(..., private cdr: ChangeDetectorRef) {}

loadUserProfile() {
    this.moodle.getSiteInfo().subscribe({
        next: (...) => {
            // ... lógica ...
            this.loading = false;
            this.cdr.detectChanges(); // <--- FORZAR ACTUALIZACIÓN
        },
        // ...
    });
}
```

## 🚀 Resultado Esperado
El perfil debería cargar y mostrarse inmediatamente sin necesidad de interacción adicional.
