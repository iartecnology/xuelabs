import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { ApiConfig } from './components/api-config/api-config';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', component: Dashboard, canActivate: [authGuard] },
    { path: 'login', component: Login },
    { path: 'course/:id', loadComponent: () => import('./components/course-viewer/course-viewer').then(m => m.CourseViewer), canActivate: [authGuard] },
    { path: 'course/:id/grades', loadComponent: () => import('./components/grades-viewer/grades-viewer').then(m => m.GradesViewer), canActivate: [authGuard] },
    { path: 'assignment/:courseId/:cmid', loadComponent: () => import('./components/assignment-viewer/assignment-viewer').then(m => m.AssignmentViewer), canActivate: [authGuard] },
    { path: 'profile', loadComponent: () => import('./components/user-profile/user-profile').then(m => m.UserProfile), canActivate: [authGuard] },
    { path: 'courses', loadComponent: () => import('./components/my-courses/my-courses').then(m => m.MyCourses), canActivate: [authGuard] },
    { path: 'calendar', loadComponent: () => import('./components/calendar/calendar').then(m => m.Calendar), canActivate: [authGuard] },
    { path: 'messages', loadComponent: () => import('./components/messages/messages').then(m => m.Messages), canActivate: [authGuard] },
    { path: 'notifications', loadComponent: () => import('./components/notifications/notifications').then(m => m.Notifications), canActivate: [authGuard] },
    { path: 'config', component: ApiConfig },
    { path: '**', redirectTo: '' }
];
