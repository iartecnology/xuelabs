import { Component, signal, ViewChild, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { Sidebar } from './components/sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('xue-labs');
  @ViewChild(Sidebar) sidebar?: Sidebar;
  showSidebar = signal(true); // <--- Signal instead of boolean
  private router = inject(Router);

  constructor() {
    // Check initial URL logic is tricky in constructor, wait for events mostly
    // But we can check after next render or just rely on events.

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkSidebarVisibility(event.urlAfterRedirects);
    });
  }

  private checkSidebarVisibility(url: string) {
    console.log('Routing to:', url);

    // Always hide on login
    if (url.includes('/login')) {
      this.showSidebar.set(false);
      return;
    }

    // "My Courses" page (/courses) -> SHOW sidebar
    if (url.includes('/courses')) {
      this.showSidebar.set(true);
      return;
    }

    // Course Viewer (/course/:id) -> HIDE sidebar
    // Check for /course/ to detect viewer, but ensure we handled /courses above.
    if (url.includes('/course/')) {
      this.showSidebar.set(false);
      return;
    }

    // Default -> Show sidebar (Dashboard, Profile, Config, etc.)
    this.showSidebar.set(true);
  }
}
