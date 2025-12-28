import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Moodle } from '../../services/moodle';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-recent-activities',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recent-activities.html',
  styleUrl: './recent-activities.css',
})
export class RecentActivities implements OnInit {
  moodle = inject(Moodle);
  cdr = inject(ChangeDetectorRef);

  activities: any[] = [];
  loading = true;

  ngOnInit() {
    this.loadRecentActivities();
  }

  loadRecentActivities() {
    this.loading = true;

    // Get events from the past 7 days and upcoming 7 days
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60);
    const sevenDaysLater = now + (7 * 24 * 60 * 60);

    this.moodle.getCalendarEvents(sevenDaysAgo, sevenDaysLater).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (events) => {
        // Transform Moodle events into activity format
        this.activities = events
          .sort((a, b) => b.timestart - a.timestart) // Most recent first
          .slice(0, 5) // Limit to 5 items
          .map(event => ({
            id: event.id,
            title: event.name,
            course: event.course?.shortname || event.course?.fullname || 'General',
            courseId: event.courseid,
            time: this.formatRelativeTime(event.timestart),
            icon: this.getEventIcon(event),
            color: this.getEventColor(event),
            eventType: event.eventtype,
            modulename: event.modulename
          }));
      },
      error: (err) => {
        console.error('Error loading recent activities:', err);
        this.activities = [];
      }
    });
  }

  formatRelativeTime(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    // Future events
    if (diff < 0) {
      const absDiff = Math.abs(diff);
      if (absDiff < 3600) return `En ${Math.ceil(absDiff / 60)} min`;
      if (absDiff < 86400) return `En ${Math.ceil(absDiff / 3600)} horas`;
      return `En ${Math.ceil(absDiff / 86400)} días`;
    }

    // Past events
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    if (diff < 172800) return 'Ayer';
    return `Hace ${Math.floor(diff / 86400)} días`;
  }

  getEventIcon(event: any): string {
    switch (event.modulename) {
      case 'assign': return '📝';
      case 'quiz': return '✅';
      case 'forum': return '💬';
      case 'resource': return '📄';
      case 'page': return '📃';
      case 'url': return '🔗';
      case 'lesson': return '📖';
      case 'book': return '📚';
      default:
        switch (event.eventtype) {
          case 'site': return '🏫';
          case 'course': return '📚';
          case 'user': return '👤';
          case 'due': return '⏰';
          case 'close': return '🔒';
          default: return '📅';
        }
    }
  }

  getEventColor(event: any): string {
    switch (event.modulename) {
      case 'assign': return '#ec4899';
      case 'quiz': return '#10b981';
      case 'forum': return '#3b82f6';
      default:
        switch (event.eventtype) {
          case 'site': return '#6366f1';
          case 'course': return '#f59e0b';
          case 'due': return '#ef4444';
          case 'close': return '#dc2626';
          default: return '#8b5cf6';
        }
    }
  }
}
