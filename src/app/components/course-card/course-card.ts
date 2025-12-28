import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './course-card.html',
  styleUrl: './course-card.css',
})
export class CourseCard {
  @Input() course: any;

  // Individual inputs for flexibility
  @Input() title: string = '';
  @Input() progress: number = 0;
  @Input() image: string = '';
  @Input() color: string = ''; // Default empty to allow theme fallback
  @Input() id: number = 0;
  @Input() enrolledUsers: number = 0;
  @Input() category: string = '';
  @Input() shortname: string = '';

  // Helper to get efficient values
  get displayTitle(): string { return this.title || this.course?.title || this.course?.fullname || 'Curso sin nombre'; }
  get displayProgress(): number { return this.progress || this.course?.progress || 0; }
  get displayImage(): string { return this.image || this.course?.image || this.course?.courseimage || ''; }
  get displayColor(): string { return this.color || this.course?.color || 'var(--primary-600)'; }
  get displayId(): number { return this.id || this.course?.id || 0; }
  get displayEnrolledUsers(): number { return this.enrolledUsers || this.course?.enrolledusercount || 0; }
  get displayCategory(): string { return this.category || this.course?.categoryname || ''; }
  get displayShortname(): string { return this.shortname || this.course?.shortname || ''; }
}
