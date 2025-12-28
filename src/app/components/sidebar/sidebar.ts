import { Component, inject, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Moodle } from '../../services/moodle';
import { ThemeService } from '../../services/theme'; // Import
import { Observable, of, interval, startWith } from 'rxjs';
import { catchError, switchMap, tap, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  isMobileMenuOpen = false;
  isSidebarCollapsed = false;
  isUserMenuOpen = false;

  public moodle = inject(Moodle);
  public themeService = inject(ThemeService); // Inject public to use in template
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // PWA Install
  deferredPrompt: any;
  showInstallBtn = false;

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: any) {
    e.preventDefault();
    this.deferredPrompt = e;
    this.showInstallBtn = true;
    this.cdr.detectChanges();
  }

  // Observable for the current user
  currentUser$!: Observable<any>;
  unreadMessagesCount$!: Observable<number>;
  unreadNotificationsCount$!: Observable<number>;

  ngOnInit() {
    // Load user when config is available
    this.currentUser$ = this.moodle.config$.pipe(
      switchMap(config => {
        if (config && config.token) {
          return this.moodle.getCurrentUser().pipe(
            catchError(err => {
              console.error('Error loading user:', err);
              this.moodle.clearConfig();
              this.router.navigate(['/login']);
              return of(null);
            })
          );
        }
        return of(null);
      }),
      tap(() => this.cdr.detectChanges()), // Force update when user loads
      shareReplay(1)
    );

    const pollInterval$ = interval(30000).pipe(startWith(0));

    this.unreadMessagesCount$ = this.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return pollInterval$.pipe(
            switchMap(() => this.moodle.getUnreadMessagesCount(user.id))
          );
        }
        return of(0);
      }),
      shareReplay(1)
    );

    this.unreadNotificationsCount$ = this.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return pollInterval$.pipe(
            switchMap(() => this.moodle.getUnreadNotificationsCount(user.id))
          );
        }
        return of(0);
      }),
      shareReplay(1)
    );
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  logout() {
    this.closeMobileMenu();
    this.closeUserMenu();
    this.moodle.logout();
  }

  installPWA() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
      }
      this.deferredPrompt = null;
      this.showInstallBtn = false;
      this.cdr.detectChanges();
    });
  }

  getUserInitials(fullname: string): string {
    if (!fullname) return 'U';
    const parts = fullname.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullname.substring(0, 2).toUpperCase();
  }
}
