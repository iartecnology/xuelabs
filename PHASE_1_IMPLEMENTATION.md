# Implementación Rápida - Fase 1 (Versión Básica)

## RESUMEN
Este documento contiene el código para implementar versiones básicas de:
1. Calificaciones
2. Tareas mejoradas
3. Foros (vista)
4. Notificaciones

---

## 1. CALIFICACIONES

### Archivos ya creados:
- ✅ `/src/app/components/grades-viewer/grades-viewer.ts`

### Archivos pendientes:

#### `/src/app/components/grades-viewer/grades-viewer.html`
```html
<div class="grades-container">
    <div class="grades-header">
        <button class="btn-back" onclick="history.back()">
            <span>←</span> Volver al Curso
        </button>
        <h1>📊 Calificaciones</h1>
    </div>

    <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando calificaciones...</p>
    </div>

    <div *ngIf="error" class="error-state">
        <p>{{ error }}</p>
    </div>

    <div *ngIf="!loading && !error" class="grades-content">
        <!-- Resumen del curso -->
        <div class="course-summary">
            <div class="summary-card">
                <div class="summary-icon">🎯</div>
                <div class="summary-info">
                    <span class="summary-label">Promedio del Curso</span>
                    <span class="summary-value">{{ courseGrade }}%</span>
                </div>
            </div>
        </div>

        <!-- Tabla de calificaciones -->
        <div class="grades-table-container">
            <table class="grades-table">
                <thead>
                    <tr>
                        <th>Actividad</th>
                        <th>Calificación</th>
                        <th>Porcentaje</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let item of gradeItems" [class.course-total]="item.itemtype === 'course'">
                        <td>
                            <div class="item-name">
                                {{ item.itemname }}
                                <span class="item-type" *ngIf="item.itemmodule">{{ item.itemmodule }}</span>
                            </div>
                        </td>
                        <td class="grade-value">
                            {{ item.gradeformatted }}
                        </td>
                        <td>
                            <div class="percentage-bar">
                                <div class="percentage-fill" 
                                     [style.width.%]="item.percentage"
                                     [style.background-color]="getGradeColor(item.percentage)">
                                </div>
                                <span class="percentage-text">{{ item.percentage }}%</span>
                            </div>
                        </td>
                        <td class="grade-status">
                            <span class="status-icon">{{ getGradeIcon(item.percentage) }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div *ngIf="gradeItems.length === 0" class="empty-state">
            <p>No hay calificaciones disponibles aún</p>
        </div>
    </div>
</div>
```

#### `/src/app/components/grades-viewer/grades-viewer.css`
```css
.grades-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.grades-header {
    margin-bottom: 2rem;
}

.btn-back {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: none;
    color: var(--primary-600, #7c3aed);
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 1rem;
    padding: 0;
}

.btn-back:hover {
    text-decoration: underline;
}

.grades-header h1 {
    font-size: 2rem;
    color: var(--text-main, #1e293b);
    margin: 0;
}

.course-summary {
    margin-bottom: 2rem;
}

.summary-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
    padding: 2rem;
    border-radius: 16px;
    color: white;
}

.summary-icon {
    font-size: 3rem;
}

.summary-info {
    display: flex;
    flex-direction: column;
}

.summary-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

.summary-value {
    font-size: 2.5rem;
    font-weight: 700;
}

.grades-table-container {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.grades-table {
    width: 100%;
    border-collapse: collapse;
}

.grades-table thead {
    background: #f8fafc;
}

.grades-table th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: var(--text-secondary, #64748b);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.grades-table td {
    padding: 1rem;
    border-top: 1px solid #f1f5f9;
}

.item-name {
    font-weight: 500;
    color: var(--text-main, #1e293b);
}

.item-type {
    display: inline-block;
    background: #f1f5f9;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    color: var(--text-secondary, #64748b);
    margin-left: 0.5rem;
}

.grade-value {
    font-weight: 600;
    font-size: 1.1rem;
}

.percentage-bar {
    position: relative;
    width: 100%;
    height: 24px;
    background: #f1f5f9;
    border-radius: 12px;
    overflow: hidden;
}

.percentage-fill {
    height: 100%;
    transition: width 0.3s ease;
}

.percentage-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.75rem;
    font-weight: 600;
    color: #1e293b;
}

.grade-status {
    text-align: center;
    font-size: 1.5rem;
}

.course-total {
    background: #f8fafc;
    font-weight: 700;
}

.loading-state, .error-state, .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-secondary, #64748b);
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top-color: var(--primary-600, #7c3aed);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

### Añadir API en `/src/app/services/moodle.ts`:
```typescript
// Añadir después del método getAssignmentStatus

getCourseGrades(courseId: number): Observable<any[]> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('gradereport_user_get_grade_items', {
        courseid: courseId
    }, config).pipe(
        map((response: any) => {
            return response.usergrades && response.usergrades[0] 
                ? response.usergrades[0].gradeitems 
                : [];
        }),
        catchError((error) => {
            console.error('Error fetching grades:', error);
            return of([]);
        })
    );
}
```

### Añadir ruta en `/src/app/app.routes.ts`:
```typescript
import { GradesViewer } from './components/grades-viewer/grades-viewer';

// Añadir en el array de routes:
{
    path: 'course/:id/grades',
    component: GradesViewer
}
```

### Añadir botón en `/src/app/components/course-viewer/course-viewer.html`:
```html
<!-- Añadir en el sidebar-header, después del título -->
<button [routerLink]="['/course', courseId, 'grades']" class="btn-grades">
    📊 Ver Calificaciones
</button>
```

### Añadir estilos en `/src/app/components/course-viewer/course-viewer.css`:
```css
.btn-grades {
    margin-top: 1rem;
    width: 100%;
    padding: 0.75rem;
    background: var(--primary-600, #7c3aed);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-grades:hover {
    background: var(--primary-700, #6d28d9);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3);
}
```

---

## PRÓXIMOS PASOS

Debido a la extensión del código, he documentado la implementación completa de **Calificaciones**.

Para las otras 3 funcionalidades (Tareas, Foros, Notificaciones), necesitaría crear documentos similares.

**¿Quieres que:**
1. Continue documentando las otras 3 funcionalidades
2. Implemente solo Calificaciones primero y probemos
3. Te dé un resumen ejecutivo de cómo implementar las otras 3

¿Qué prefieres?
