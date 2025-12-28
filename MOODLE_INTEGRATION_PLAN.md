# 🔗 Plan de Integración Completa con Moodle

## 📋 Estado Actual

### ✅ Completado
- [x] Servicio Moodle básico (`moodle.ts`)
- [x] Login con usuario/contraseña
- [x] Obtención de cursos del usuario (`getUserCourses()`)
- [x] Obtención de información del usuario (`getCurrentUser()`)
- [x] Obtención de eventos del calendario (`getCalendarEvents()`)
- [x] Sistema de autenticación con Guards
- [x] Diseño responsivo completo
- [x] Menú de usuario con dropdown

### ❌ Pendiente
- [ ] Visor de categorías de cursos
- [ ] Visor detallado de cursos
- [ ] Contenido de cursos (secciones, módulos)
- [ ] Sistema de calificaciones
- [ ] Foros y mensajería
- [ ] Tareas y entregas
- [ ] Cuestionarios
- [ ] Recursos descargables
- [ ] Progreso del curso
- [ ] Certificados

---

## 🎯 Modificaciones Necesarias

### 1️⃣ **Servicio Moodle - Nuevos Métodos**

**Archivo**: `src/app/services/moodle.ts`

#### Métodos a Agregar:

```typescript
// 1. Obtener todas las categorías de cursos
getCourseCategories(): Observable<MoodleCategory[]> {
  return this.callMoodleFunction('core_course_get_categories', {}, config);
}

// 2. Obtener cursos por categoría
getCoursesByCategory(categoryId: number): Observable<MoodleCourse[]> {
  return this.callMoodleFunction('core_course_get_courses_by_field', {
    field: 'category',
    value: categoryId
  }, config);
}

// 3. Obtener todos los cursos disponibles (no solo los del usuario)
getAllCourses(): Observable<MoodleCourse[]> {
  return this.callMoodleFunction('core_course_get_courses', {}, config);
}

// 4. Obtener detalles completos de un curso
getCourseDetails(courseId: number): Observable<any> {
  return this.callMoodleFunction('core_course_get_courses', {
    options: { ids: [courseId] }
  }, config);
}

// 5. Obtener contenido del curso (secciones y módulos)
getCourseContents(courseId: number): Observable<any[]> {
  return this.callMoodleFunction('core_course_get_contents', {
    courseid: courseId
  }, config);
}

// 6. Obtener calificaciones del usuario en un curso
getCourseGrades(courseId: number): Observable<any> {
  return this.callMoodleFunction('gradereport_user_get_grade_items', {
    courseid: courseId
  }, config);
}

// 7. Obtener foros del curso
getCourseForums(courseId: number): Observable<any[]> {
  return this.callMoodleFunction('mod_forum_get_forums_by_courses', {
    courseids: [courseId]
  }, config);
}

// 8. Obtener tareas del curso
getCourseAssignments(courseId: number): Observable<any[]> {
  return this.callMoodleFunction('mod_assign_get_assignments', {
    courseids: [courseId]
  }, config);
}

// 9. Obtener progreso del curso
getCourseProgress(courseId: number): Observable<any> {
  return this.callMoodleFunction('core_completion_get_activities_completion_status', {
    courseid: courseId
  }, config);
}

// 10. Inscribirse en un curso
enrollInCourse(courseId: number): Observable<boolean> {
  return this.callMoodleFunction('enrol_self_enrol_user', {
    courseid: courseId
  }, config);
}
```

#### Interfaces a Agregar:

```typescript
export interface MoodleCategory {
  id: number;
  name: string;
  description: string;
  descriptionformat: number;
  parent: number;
  sortorder: number;
  coursecount: number;
  depth: number;
  path: string;
}

export interface MoodleModule {
  id: number;
  url: string;
  name: string;
  instance: number;
  description: string;
  visible: number;
  uservisible: boolean;
  modicon: string;
  modname: string;
  modplural: string;
  indent: number;
  completion: number;
  completiondata?: any;
}

export interface MoodleSection {
  id: number;
  name: string;
  visible: number;
  summary: string;
  summaryformat: number;
  section: number;
  hiddenbynumsections: number;
  uservisible: boolean;
  modules: MoodleModule[];
}
```

---

### 2️⃣ **Dashboard - Visor de Categorías y Cursos**

**Archivo**: `src/app/components/dashboard/dashboard.ts`

#### Modificaciones:

```typescript
export class Dashboard implements OnInit {
  categories: MoodleCategory[] = [];
  allCourses: MoodleCourse[] = [];
  selectedCategory: number | null = null;
  filteredCourses: MoodleCourse[] = [];
  
  ngOnInit() {
    this.loadCategories();
    this.loadAllCourses();
    this.loadUserCourses(); // Existente
  }

  loadCategories() {
    this.moodle.getCourseCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  loadAllCourses() {
    this.moodle.getAllCourses().subscribe({
      next: (courses) => {
        this.allCourses = courses;
        this.filteredCourses = courses;
      },
      error: (err) => console.error('Error loading courses:', err)
    });
  }

  filterByCategory(categoryId: number | null) {
    this.selectedCategory = categoryId;
    if (categoryId === null) {
      this.filteredCourses = this.allCourses;
    } else {
      this.moodle.getCoursesByCategory(categoryId).subscribe({
        next: (courses) => {
          this.filteredCourses = courses;
        }
      });
    }
  }
}
```

**Archivo**: `src/app/components/dashboard/dashboard.html`

#### Estructura Propuesta:

```html
<div class="dashboard">
  <!-- Header con filtros -->
  <div class="dashboard-header">
    <h1>Explorar Cursos</h1>
    
    <!-- Filtro de categorías -->
    <div class="category-filter">
      <button 
        class="category-btn" 
        [class.active]="selectedCategory === null"
        (click)="filterByCategory(null)">
        Todos los Cursos
      </button>
      <button 
        *ngFor="let category of categories"
        class="category-btn"
        [class.active]="selectedCategory === category.id"
        (click)="filterByCategory(category.id)">
        {{ category.name }} ({{ category.coursecount }})
      </button>
    </div>
  </div>

  <!-- Grid de cursos -->
  <div class="courses-section">
    <h2>{{ selectedCategory ? 'Cursos Filtrados' : 'Todos los Cursos' }}</h2>
    <div class="courses-grid">
      <div *ngFor="let course of filteredCourses" class="course-card">
        <div class="course-image">
          <img [src]="course.imageurl || 'assets/default-course.jpg'" 
               [alt]="course.fullname">
        </div>
        <div class="course-info">
          <h3>{{ course.fullname }}</h3>
          <p class="course-category">{{ course.categoryname }}</p>
          <div class="course-meta">
            <span class="enrolled-count">
              👥 {{ course.enrolledusercount || 0 }} estudiantes
            </span>
          </div>
          <div [innerHTML]="course.summary" class="course-summary"></div>
          <div class="course-actions">
            <button 
              class="btn-primary" 
              [routerLink]="['/course', course.id]">
              Ver Curso
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mis cursos (sección separada) -->
  <div class="my-courses-section">
    <h2>Mis Cursos Activos</h2>
    <div class="courses-grid">
      <div *ngFor="let course of userCourses" class="course-card enrolled">
        <!-- Similar estructura pero con progreso -->
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="course.progress"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### 3️⃣ **Componente de Detalle de Curso**

**Crear**: `src/app/components/course-detail/`

#### Archivos:
- `course-detail.ts`
- `course-detail.html`
- `course-detail.css`

**course-detail.ts**:

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Moodle, MoodleSection } from '../../services/moodle';

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css'
})
export class CourseDetail implements OnInit {
  courseId!: number;
  course: any = null;
  sections: MoodleSection[] = [];
  grades: any = null;
  progress: any = null;
  isEnrolled: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private moodle: Moodle
  ) {}

  ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCourseData();
  }

  loadCourseData() {
    // Cargar detalles del curso
    this.moodle.getCourseDetails(this.courseId).subscribe({
      next: (courses) => {
        this.course = courses[0];
      }
    });

    // Cargar contenido (secciones y módulos)
    this.moodle.getCourseContents(this.courseId).subscribe({
      next: (sections) => {
        this.sections = sections;
      }
    });

    // Cargar calificaciones
    this.moodle.getCourseGrades(this.courseId).subscribe({
      next: (grades) => {
        this.grades = grades;
      }
    });

    // Cargar progreso
    this.moodle.getCourseProgress(this.courseId).subscribe({
      next: (progress) => {
        this.progress = progress;
      }
    });
  }

  enrollInCourse() {
    this.moodle.enrollInCourse(this.courseId).subscribe({
      next: () => {
        this.isEnrolled = true;
        this.loadCourseData();
      }
    });
  }
}
```

**course-detail.html**:

```html
<div class="course-detail" *ngIf="course">
  <!-- Header del curso -->
  <div class="course-header">
    <div class="course-banner">
      <img [src]="course.imageurl" [alt]="course.fullname">
    </div>
    <div class="course-title-section">
      <h1>{{ course.fullname }}</h1>
      <p class="course-shortname">{{ course.shortname }}</p>
      <div class="course-meta">
        <span>📚 {{ course.categoryname }}</span>
        <span>👥 {{ course.enrolledusercount }} estudiantes</span>
      </div>
      <button 
        *ngIf="!isEnrolled" 
        class="btn-enroll"
        (click)="enrollInCourse()">
        Inscribirse en este Curso
      </button>
    </div>
  </div>

  <!-- Tabs de navegación -->
  <div class="course-tabs">
    <button class="tab active">📖 Contenido</button>
    <button class="tab">📊 Calificaciones</button>
    <button class="tab">💬 Foros</button>
    <button class="tab">📝 Tareas</button>
  </div>

  <!-- Contenido del curso (secciones) -->
  <div class="course-content">
    <div *ngFor="let section of sections" class="course-section">
      <h2 class="section-title">
        {{ section.name || 'Sección ' + section.section }}
      </h2>
      <div class="section-summary" [innerHTML]="section.summary"></div>
      
      <!-- Módulos de la sección -->
      <div class="section-modules">
        <div *ngFor="let module of section.modules" class="module-item">
          <div class="module-icon">
            <img [src]="module.modicon" [alt]="module.modname">
          </div>
          <div class="module-info">
            <h3>{{ module.name }}</h3>
            <span class="module-type">{{ module.modplural }}</span>
          </div>
          <div class="module-actions">
            <a [href]="module.url" target="_blank" class="btn-view">
              Ver
            </a>
          </div>
          <div class="module-completion" *ngIf="module.completion">
            <span *ngIf="module.completiondata?.state === 1">✅</span>
            <span *ngIf="module.completiondata?.state === 0">⭕</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Barra lateral con información -->
  <aside class="course-sidebar">
    <!-- Progreso -->
    <div class="widget progress-widget">
      <h3>Tu Progreso</h3>
      <div class="progress-circle">
        <span>{{ progress?.percentage || 0 }}%</span>
      </div>
    </div>

    <!-- Calificaciones -->
    <div class="widget grades-widget">
      <h3>Calificaciones</h3>
      <div *ngIf="grades" class="grades-list">
        <!-- Mostrar calificaciones -->
      </div>
    </div>
  </aside>
</div>
```

---

### 4️⃣ **Rutas a Agregar**

**Archivo**: `src/app/app.routes.ts`

```typescript
import { CourseDetail } from './components/course-detail/course-detail';

export const routes: Routes = [
  { path: '', component: Dashboard, canActivate: [authGuard] },
  { path: 'login', component: Login },
  { path: 'course/:id', component: CourseDetail, canActivate: [authGuard] },
  { path: 'courses', component: Dashboard, canActivate: [authGuard] }, // Alias
  { path: 'profile', component: UserProfile, canActivate: [authGuard] }, // Crear
  { path: 'config', component: ApiConfig, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
```

---

### 5️⃣ **Componentes Adicionales a Crear**

#### A. **User Profile** (`src/app/components/user-profile/`)
- Mostrar información del usuario
- Editar perfil
- Ver historial de cursos
- Certificados obtenidos

#### B. **Course List** (Mejorar Dashboard)
- Vista de lista vs grid
- Búsqueda de cursos
- Filtros avanzados (nivel, duración, instructor)

#### C. **Calendar View** (`src/app/components/calendar/`)
- Vista de calendario con eventos
- Tareas pendientes
- Exámenes próximos

#### D. **Notifications** (`src/app/components/notifications/`)
- Centro de notificaciones
- Mensajes del sistema
- Actualizaciones de cursos

---

### 6️⃣ **Mejoras en el Sidebar**

**Archivo**: `src/app/components/sidebar/sidebar.html`

Actualizar enlaces:

```html
<li>
  <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
    <span class="icon">🏠</span>
    <span class="link-text">Inicio</span>
  </a>
</li>
<li>
  <a routerLink="/courses" routerLinkActive="active">
    <span class="icon">📚</span>
    <span class="link-text">Explorar Cursos</span>
  </a>
</li>
<li>
  <a routerLink="/my-courses" routerLinkActive="active">
    <span class="icon">🎓</span>
    <span class="link-text">Mis Cursos</span>
  </a>
</li>
<li>
  <a routerLink="/calendar" routerLinkActive="active">
    <span class="icon">📅</span>
    <span class="link-text">Calendario</span>
  </a>
</li>
<li>
  <a routerLink="/grades" routerLinkActive="active">
    <span class="icon">📊</span>
    <span class="link-text">Calificaciones</span>
  </a>
</li>
```

---

### 7️⃣ **Actualizar Usuario Dinámicamente**

**Archivo**: `src/app/components/sidebar/sidebar.ts`

```typescript
export class Sidebar implements OnInit {
  currentUser: MoodleUser | null = null;

  ngOnInit() {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    this.moodle.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      }
    });
  }
}
```

**Archivo**: `src/app/components/sidebar/sidebar.html`

```html
<div class="user-profile" *ngIf="currentUser">
  <div class="avatar">{{ getInitials(currentUser.fullname) }}</div>
  <div class="info">
    <span class="name">{{ currentUser.fullname }}</span>
    <span class="role">{{ currentUser.email }}</span>
  </div>
</div>
```

---

## 📊 Priorización de Tareas

### 🔴 **Alta Prioridad** (Implementar primero)
1. ✅ Métodos de servicio para categorías y cursos
2. ✅ Visor de categorías en Dashboard
3. ✅ Componente de detalle de curso
4. ✅ Rutas para navegación
5. ✅ Usuario dinámico en sidebar

### 🟡 **Media Prioridad** (Implementar después)
6. Vista de calificaciones
7. Sistema de progreso visual
8. Calendario de eventos
9. Perfil de usuario

### 🟢 **Baja Prioridad** (Opcional)
10. Foros y mensajería
11. Sistema de notificaciones
12. Descarga de recursos
13. Certificados

---

## 🚀 Orden de Implementación Sugerido

### Fase 1: Exploración de Cursos (2-3 horas)
1. Agregar métodos al servicio Moodle
2. Actualizar Dashboard con categorías
3. Implementar filtrado por categoría
4. Mejorar diseño de tarjetas de curso

### Fase 2: Detalle de Curso (3-4 horas)
1. Crear componente CourseDetail
2. Mostrar secciones y módulos
3. Implementar navegación
4. Agregar inscripción a cursos

### Fase 3: Funcionalidades Avanzadas (4-5 horas)
1. Sistema de calificaciones
2. Progreso del curso
3. Calendario de eventos
4. Perfil de usuario

### Fase 4: Pulido y Optimización (2-3 horas)
1. Mejorar diseño responsive
2. Agregar animaciones
3. Optimizar rendimiento
4. Testing completo

---

## 📝 Notas Importantes

### Permisos Necesarios en Moodle
Asegúrate de que el servicio web tenga habilitadas estas funciones:
- `core_course_get_categories`
- `core_course_get_courses`
- `core_course_get_courses_by_field`
- `core_course_get_contents`
- `gradereport_user_get_grade_items`
- `core_completion_get_activities_completion_status`
- `mod_forum_get_forums_by_courses`
- `mod_assign_get_assignments`
- `enrol_self_enrol_user`

### Testing
Para cada funcionalidad, verifica:
1. ✅ Conexión exitosa con API
2. ✅ Manejo de errores
3. ✅ Loading states
4. ✅ Diseño responsive
5. ✅ Navegación correcta

---

## 🎯 Resultado Final Esperado

Una aplicación completa que permita:
- ✅ Explorar todos los cursos disponibles
- ✅ Filtrar por categorías
- ✅ Ver detalles completos de cada curso
- ✅ Inscribirse en cursos
- ✅ Ver contenido (secciones, módulos, recursos)
- ✅ Seguir progreso
- ✅ Ver calificaciones
- ✅ Gestionar perfil
- ✅ Calendario de eventos

---

**¿Por dónde empezamos?** 🚀
