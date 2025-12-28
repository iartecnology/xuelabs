# Plan: Visor de Foros Básico

## Objetivo
Mostrar las discusiones de foros (como "Avisos") como HTML procesado en lugar de iframe, replicando la app móvil.

## Estrategia

### 1. Detectar si es un foro de noticias (Avisos)
```typescript
if (module.modname === 'forum') {
    // Check if it's a news forum
    this.loadForumDiscussions(module.instance);
}
```

### 2. Cargar discusiones del foro
Ya tenemos las APIs:
- `getForums(courseId)` - Obtener foros del curso
- `getForumDiscussions(forumId)` - Obtener discusiones

### 3. Renderizar como HTML
Mostrar lista de discusiones con:
- Título
- Autor
- Fecha
- Mensaje (HTML procesado con tokens)

### 4. Permitir ver discusión completa
Click en una discusión → Ver posts completos

## Implementación Rápida

Modificar `selectModule` para foros:

```typescript
if (module.modname === 'forum') {
    // Load forum discussions and render as HTML
    this.loadForumContent(module.instance);
    return;
}
```

Añadir método:
```typescript
loadForumContent(forumId: number) {
    this.moodle.getForumDiscussions(forumId).subscribe({
        next: (discussions) => {
            // Build HTML from discussions
            let html = '<div class="forum-discussions">';
            discussions.forEach(d => {
                html += `
                    <div class="discussion-item">
                        <h3>${d.name}</h3>
                        <div class="discussion-meta">
                            Por ${d.userfullname} - ${new Date(d.timemodified * 1000).toLocaleDateString()}
                        </div>
                        <div class="discussion-message">
                            ${d.message}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            this.safeHtmlContent = this.processMediaTokens(html);
        }
    });
}
```

¿Quieres que implemente esto ahora?
