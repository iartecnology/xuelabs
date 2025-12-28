import { Component, OnInit, inject, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Moodle } from '../../services/moodle';
import { MoodleCalendarEvent } from '../../interfaces/moodle-types';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class Calendar implements OnInit {
  moodle = inject(Moodle);
  cdr = inject(ChangeDetectorRef);

  @Input() isWidget = false;

  // View mode: month, week, day
  viewMode: 'month' | 'week' | 'day' = 'month';

  currentDate = new Date();
  daysInMonth: Date[] = [];
  daysInWeek: Date[] = [];
  events: MoodleCalendarEvent[] = [];

  // Pending activities (action required)
  pendingActivities: any[] = [];
  loadingPending = false;

  selectedDate: Date = new Date();
  selectedDateEvents: MoodleCalendarEvent[] = [];

  loading = false;
  weekDayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  weekDayNamesShort = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  // Hours for day view
  hoursOfDay = Array.from({ length: 24 }, (_, i) => i);

  ngOnInit() {
    this.generateCalendar();
    this.loadEvents();
    this.loadPendingActivities();
  }

  setViewMode(mode: 'month' | 'week' | 'day') {
    this.viewMode = mode;
    this.generateCalendar();
    this.loadEvents();
  }

  generateCalendar() {
    if (this.viewMode === 'month') {
      this.generateMonthView();
    } else if (this.viewMode === 'week') {
      this.generateWeekView();
    }
    // Day view doesn't need days array
  }

  generateMonthView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(lastDay);
    if (endDate.getDay() < 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    this.daysInMonth = [];
    const loopDate = new Date(startDate);
    while (loopDate <= endDate) {
      this.daysInMonth.push(new Date(loopDate));
      loopDate.setDate(loopDate.getDate() + 1);
    }
  }

  generateWeekView() {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    this.daysInWeek = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      this.daysInWeek.push(day);
    }
  }

  loadEvents() {
    let start: number, end: number;

    if (this.viewMode === 'month' && this.daysInMonth.length > 0) {
      start = Math.floor(this.daysInMonth[0].getTime() / 1000);
      end = Math.floor(this.daysInMonth[this.daysInMonth.length - 1].getTime() / 1000) + 86400;
    } else if (this.viewMode === 'week' && this.daysInWeek.length > 0) {
      start = Math.floor(this.daysInWeek[0].getTime() / 1000);
      end = Math.floor(this.daysInWeek[6].getTime() / 1000) + 86400;
    } else {
      // Day view
      const dayStart = new Date(this.selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(this.selectedDate);
      dayEnd.setHours(23, 59, 59, 999);
      start = Math.floor(dayStart.getTime() / 1000);
      end = Math.floor(dayEnd.getTime() / 1000);
    }

    this.loading = true;
    this.moodle.getCalendarEvents(start, end).pipe(
      finalize(() => {
        this.loading = false;
        this.updateSelectedDateEvents();
        this.cdr.detectChanges();
      })
    ).subscribe(events => {
      this.events = events;
    });
  }

  loadPendingActivities() {
    this.loadingPending = true;

    // Get upcoming events (next 30 days) that require action
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysLater = now + (30 * 24 * 60 * 60);

    this.moodle.getCalendarEvents(now, thirtyDaysLater).pipe(
      finalize(() => {
        this.loadingPending = false;
        this.cdr.detectChanges();
      })
    ).subscribe(events => {
      // Filter for activities that require action (assignments, quizzes due soon)
      this.pendingActivities = events
        .filter(e =>
          e.eventtype === 'due' ||
          e.eventtype === 'close' ||
          e.modulename === 'assign' ||
          e.modulename === 'quiz'
        )
        .sort((a, b) => a.timestart - b.timestart)
        .slice(0, 10); // Limit to 10 items
    });
  }

  // Navigation
  prev() {
    if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    } else if (this.viewMode === 'week') {
      this.currentDate = new Date(this.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      this.selectedDate = new Date(this.selectedDate.getTime() - 24 * 60 * 60 * 1000);
      this.currentDate = this.selectedDate;
    }
    this.generateCalendar();
    this.loadEvents();
  }

  next() {
    if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    } else if (this.viewMode === 'week') {
      this.currentDate = new Date(this.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      this.selectedDate = new Date(this.selectedDate.getTime() + 24 * 60 * 60 * 1000);
      this.currentDate = this.selectedDate;
    }
    this.generateCalendar();
    this.loadEvents();
  }

  goToToday() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.generateCalendar();
    this.loadEvents();
  }

  // Legacy methods for backward compatibility
  prevMonth() { this.prev(); }
  nextMonth() { this.next(); }

  selectDate(date: Date) {
    if (date.getMonth() !== this.currentDate.getMonth()) {
      this.currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
      this.generateCalendar();
      this.loadEvents();
    }
    this.selectedDate = date;
    this.updateSelectedDateEvents();
  }

  updateSelectedDateEvents() {
    const selStart = new Date(this.selectedDate);
    selStart.setHours(0, 0, 0, 0);
    const selEnd = new Date(this.selectedDate);
    selEnd.setHours(23, 59, 59, 999);

    this.selectedDateEvents = this.events.filter(e => {
      const eDate = new Date(e.timestart * 1000);
      return eDate >= selStart && eDate <= selEnd;
    });
  }

  hasEvents(date: Date): boolean {
    const dStart = new Date(date); dStart.setHours(0, 0, 0, 0);
    const dEnd = new Date(date); dEnd.setHours(23, 59, 59, 999);

    return this.events.some(e => {
      const eDate = new Date(e.timestart * 1000);
      return eDate >= dStart && eDate <= dEnd;
    });
  }

  getEventsForDate(date: Date): MoodleCalendarEvent[] {
    const dStart = new Date(date); dStart.setHours(0, 0, 0, 0);
    const dEnd = new Date(date); dEnd.setHours(23, 59, 59, 999);

    return this.events.filter(e => {
      const eDate = new Date(e.timestart * 1000);
      return eDate >= dStart && eDate <= dEnd;
    });
  }

  getEventsForHour(hour: number): MoodleCalendarEvent[] {
    return this.selectedDateEvents.filter(e => {
      const eDate = new Date(e.timestart * 1000);
      return eDate.getHours() === hour;
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  isSameMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth();
  }

  isSelected(date: Date): boolean {
    return date.getDate() === this.selectedDate.getDate() &&
      date.getMonth() === this.selectedDate.getMonth() &&
      date.getFullYear() === this.selectedDate.getFullYear();
  }

  getEventIcon(event: any): string {
    if (event.modulename === 'assign') return '📝';
    if (event.modulename === 'quiz') return '✅';
    if (event.modulename === 'forum') return '💬';
    if (event.eventtype === 'course') return '📚';
    if (event.eventtype === 'site') return '🏫';
    return '📅';
  }

  getDaysUntil(timestamp: number): string {
    const now = new Date();
    const eventDate = new Date(timestamp * 1000);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Vencido';
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    return `En ${diffDays} días`;
  }

  getUrgencyClass(timestamp: number): string {
    const now = new Date();
    const eventDate = new Date(timestamp * 1000);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'soon';
    return 'normal';
  }

  getWeekRangeText(): string {
    if (this.daysInWeek.length === 0) return '';
    const start = this.daysInWeek[0];
    const end = this.daysInWeek[6];
    const startStr = start.getDate();
    const endStr = end.getDate();
    const month = end.toLocaleDateString('es', { month: 'long' });
    return `${startStr} - ${endStr} ${month}`;
  }
}
