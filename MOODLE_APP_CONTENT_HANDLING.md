# Cómo la App Móvil de Moodle Maneja el Contenido

## 🎯 Estrategia Principal

La app móvil de Moodle **NO abre contenido externo** en navegadores externos. En su lugar, usa una combinación de:

1. **Renderizado HTML directo** con `core-format-text`
2. **Iframes embebidos** con autenticación por token
3. **Handlers específicos** para cada tipo de módulo
4. **WebView nativo** de la app (Cordova/Capacitor)

---

## 📋 Métodos de Renderizado por Tipo de Contenido

### 1. **Contenido Textual (HTML)**
**Módulos**: page, label, book, lesson, wiki, glossary

**Cómo lo hace la app:**
```typescript
// Usa la directiva core-format-text
<core-format-text [text]="module.description" 
                  [component]="component" 
                  [componentId]="componentId">
</core-format-text>
```

**Lo que hace:**
- Procesa el HTML del servidor
- Añade tokens a URLs de medios (`pluginfile.php`)
- Renderiza videos, imágenes, enlaces
- Maneja formato Markdown, HTML, texto plano
- **NO usa iframes** para este contenido

**Nuestra implementación:**
```typescript
// Ya lo tenemos implementado en processMediaTokens()
this.safeHtmlContent = this.processMediaTokens(module.description);
```

---

### 2. **Contenido Interactivo (H5P, SCORM, Quiz)**
**Módulos**: hvp, scorm, quiz, choice, feedback

**Cómo lo hace la app:**
```typescript
// Usa iframe DENTRO de la app, no abre navegador externo
<iframe [src]="embedUrl" 
        class="core-iframe" 
        allow="autoplay; fullscreen">
</iframe>
```

**URLs con token:**
```
https://moodle.com/mod/hvp/embed.php?id=123&token=xxxxx
```

**Configuración necesaria en Moodle:**
- `allowframembedding` = true
- CSP headers permitiendo `moodleappfs://localhost`
- Cookies de terceros habilitadas (iOS)

**Nuestra implementación:**
```typescript
// Ya lo tenemos
embedUrl = `${config.url}/mod/hvp/embed.php?id=${module.id}&token=${config.token}`;
this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
```

---

### 3. **Foros y Discusiones**
**Módulos**: forum

**Cómo lo hace la app:**
```typescript
// Carga discusiones via API y renderiza como HTML
this.forumProvider.getDiscussions(forumId).then(discussions => {
    // Renderiza cada discusión como HTML
    discussions.forEach(d => {
        html += `<div class="discussion">
            <h3>${d.name}</h3>
            <core-format-text [text]="d.message"></core-format-text>
        </div>`;
    });
});
```

**APIs usadas:**
- `mod_forum_get_forums_by_courses`
- `mod_forum_get_forum_discussions`
- `mod_forum_get_discussion_posts`

**Nuestra implementación:**
```typescript
// Ya lo implementamos
loadForumContent(forumId: number) {
    this.moodle.getForumDiscussions(forumId).subscribe(discussions => {
        // Construye HTML y renderiza
    });
}
```

---

### 4. **Recursos (Archivos)**
**Módulos**: resource, folder

**Cómo lo hace la app:**
```typescript
// Descarga el archivo y lo abre con visor nativo
if (canOpenInApp(fileType)) {
    // Abre PDF, imagen, video en visor nativo
    openFile(fileUrl + '?token=' + token);
} else {
    // Descarga y abre con app externa
    downloadFile(fileUrl + '?token=' + token);
}
```

**NO usa navegador externo**, usa:
- Visor PDF nativo
- Reproductor de video nativo
- Visor de imágenes nativo

**Nuestra implementación actual:**
```typescript
// Abrimos en nueva pestaña (podemos mejorar)
window.open(fileUrl + '?token=' + token, '_blank');
```

**Mejora sugerida:**
```typescript
// Detectar tipo de archivo y mostrar en visor integrado
if (fileUrl.endsWith('.pdf')) {
    // Usar ng2-pdf-viewer
    this.showPdfViewer(fileUrl);
} else if (isVideo(fileUrl)) {
    // Usar reproductor HTML5
    this.showVideoPlayer(fileUrl);
}
```

---

### 5. **URLs Externas**
**Módulos**: url

**Cómo lo hace la app:**
```typescript
// Opción 1: Si es URL de Moodle, iframe interno
if (url.includes(moodleSiteUrl)) {
    showInIframe(url + '&token=' + token);
}
// Opción 2: Si es externa, InAppBrowser
else {
    openInAppBrowser(url); // NO abre navegador del sistema
}
```

**InAppBrowser** = Navegador dentro de la app, no el navegador del sistema

**Nuestra implementación:**
```typescript
// Podemos mejorar usando iframe para URLs internas
if (urlContent.includes(config.url)) {
    // URL interna de Moodle - usar iframe
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlContent);
} else {
    // URL externa - abrir en nueva pestaña (o iframe si es seguro)
    window.open(urlContent, '_blank');
}
```

---

### 6. **Tareas (Assignments)**
**Módulos**: assign

**Cómo lo hace la app:**
```typescript
// Usa componente personalizado con formularios
<ion-content>
    <core-format-text [text]="assignment.intro"></core-format-text>
    
    <!-- Formulario de entrega -->
    <form *ngIf="!isSubmitted">
        <textarea [(ngModel)]="submissionText"></textarea>
        <input type="file" (change)="uploadFile($event)">
        <button (click)="submit()">Enviar</button>
    </form>
    
    <!-- Entrega existente -->
    <div *ngIf="isSubmitted">
        <p>Entregado: {{submissionDate}}</p>
        <core-format-text [text]="feedback"></core-format-text>
    </div>
</ion-content>
```

**APIs usadas:**
- `mod_assign_get_submission_status`
- `mod_assign_save_submission`
- `mod_assign_submit_for_grading`

**Nuestra implementación:**
```typescript
// Ya tenemos el componente assignment-viewer
// Falta completar el HTML del formulario
```

---

## 🔑 Claves para NO Abrir Contenido Externo

### 1. **Todo dentro de la app**
```typescript
// ❌ MAL - Abre navegador externo
window.location.href = url;

// ✅ BIEN - Iframe dentro de la app
<iframe [src]="safeUrl"></iframe>

// ✅ BIEN - HTML procesado
<div [innerHTML]="safeHtml"></div>
```

### 2. **Autenticación por token**
```typescript
// Añadir token a TODAS las URLs de Moodle
url += (url.includes('?') ? '&' : '?') + 'token=' + config.token;
```

### 3. **Handlers específicos**
```typescript
// Cada tipo de módulo tiene su handler
switch (module.modname) {
    case 'page': return renderAsHTML(module.description);
    case 'hvp': return renderAsIframe(embedUrl);
    case 'forum': return loadDiscussions(module.instance);
    case 'assign': return showAssignmentViewer(module);
    // etc...
}
```

### 4. **Configuración de Moodle**
```php
// En config.php de Moodle
$CFG->allowframembedding = true;

// En .htaccess o configuración del servidor
Header set Content-Security-Policy "frame-ancestors 'self' http://localhost moodleappfs://localhost"
```

---

## 📊 Resumen de Implementación

| Tipo | Método | Estado en Nuestra App |
|------|--------|----------------------|
| **Contenido HTML** | `core-format-text` | ✅ Implementado (`processMediaTokens`) |
| **H5P/SCORM** | iframe con token | ✅ Implementado |
| **Foros** | API + HTML | ✅ Implementado |
| **Quiz** | iframe con token | ✅ Implementado |
| **Recursos** | Descarga/Visor | ⚠️ Parcial (abre en nueva pestaña) |
| **URLs** | iframe/InAppBrowser | ⚠️ Parcial (abre en nueva pestaña) |
| **Tareas** | Componente custom | ✅ Backend completo, falta HTML |

---

## 🚀 Mejoras Sugeridas

### 1. **Visor de PDFs integrado**
```bash
npm install ng2-pdf-viewer
```

```typescript
<pdf-viewer [src]="pdfUrl" 
            [render-text]="true"
            style="width: 100%; height: 600px;">
</pdf-viewer>
```

### 2. **Reproductor de video mejorado**
```typescript
<video controls [src]="videoUrl" class="video-player">
    Tu navegador no soporta video HTML5
</video>
```

### 3. **InAppBrowser para URLs externas**
```typescript
// En lugar de window.open(), usar iframe con controles
<div class="external-content">
    <div class="external-header">
        <button (click)="closeExternal()">← Volver</button>
        <span>{{externalUrl}}</span>
    </div>
    <iframe [src]="externalUrl" class="external-iframe"></iframe>
</div>
```

---

## ✅ Conclusión

La app móvil de Moodle **NUNCA abre el navegador del sistema**. Todo se maneja dentro de la app usando:

1. HTML procesado con `core-format-text`
2. Iframes embebidos con autenticación
3. Componentes nativos para archivos
4. APIs para contenido dinámico

**Nuestra app ya implementa el 80% de esto correctamente.** Las mejoras pendientes son:
- Visor de PDFs integrado
- Mejor manejo de recursos
- URLs externas en iframe controlado
