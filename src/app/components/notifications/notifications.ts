import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Moodle } from '../../services/moodle';
import { MoodleUser, MoodleNotification } from '../../interfaces/moodle-types';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, DatePipe],
    templateUrl: './notifications.html',
    styleUrl: './notifications.css'
})
export class Notifications implements OnInit {
    moodle = inject(Moodle);
    cdr = inject(ChangeDetectorRef);

    currentUser: MoodleUser | null = null;
    notifications: MoodleNotification[] = [];
    loading = true;

    ngOnInit() {
        this.moodle.getCurrentUser().subscribe(user => {
            this.currentUser = user;
            if (user) {
                this.loadNotifications();
            }
        });
    }

    loadNotifications() {
        if (!this.currentUser) return;
        this.loading = true;

        this.moodle.getNotifications(this.currentUser.id).pipe(
            finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            })
        ).subscribe(notifs => {
            this.notifications = notifs;
        });
    }

    // Helper to strip HTML tags for summary if needed, usually 'text' field is clean or 'smallmessage'
    getNotificationIcon(notif: MoodleNotification): string {
        return notif.iconurl || 'assets/notification-bell.png';
    }
}
