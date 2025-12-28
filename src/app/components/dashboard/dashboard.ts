import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CourseCard } from '../course-card/course-card';
import { RecentActivities } from '../recent-activities/recent-activities';
import { Calendar } from '../calendar/calendar';

import { DatePipe } from '@angular/common';
import { Moodle } from '../../services/moodle';
import { MoodleUser, MoodleCategory, MoodleCourse } from '../../interfaces/moodle-types';

@Component({
  selector: 'app-dashboard',
  imports: [CourseCard, RecentActivities, Calendar, DatePipe, CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  now = new Date();
  userName = 'Juan';

  // User's enrolled courses
  courses: any[] = [];

  // All available courses
  allCourses: MoodleCourse[] = [];
  filteredCourses: MoodleCourse[] = [];

  // Categories
  categories: MoodleCategory[] = [];
  selectedCategory: number | null = null;

  loading = true;
  loadingCategories = true;
  loadingAllCourses = true;
  isConnected = false;

  // Fallback mock data
  mockCourses = [
    { id: 1, title: 'Diseño UX/UI Avanzado', progress: 75, image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=400&q=80', color: '#ec4899', enrolledusercount: 125, category: 'DISEÑO', shortname: 'UX-202' },
    { id: 2, title: 'Desarrollo Web Full Stack', progress: 45, image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=400&q=80', color: '#3b82f6', enrolledusercount: 342, category: 'DESARROLLO', shortname: 'WEB-101' },
    { id: 3, title: 'Marketing Digital', progress: 90, image: 'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=400&q=80', color: '#8b5cf6', enrolledusercount: 89, category: 'MARKETING', shortname: 'MKT-300' },
    { id: 4, title: 'Gestión de Proyectos', progress: 30, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80', color: '#10b981', enrolledusercount: 45, category: 'NEGOCIOS', shortname: 'PM-404' },
  ];

  constructor(
    private moodleService: Moodle,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // Check connection status
    this.moodleService.connected$.subscribe(connected => {
      this.isConnected = connected;
      if (connected) {
        this.loadMoodleData();
        this.loadCategories();
        this.loadAllCourses();
      } else {
        this.courses = [];
        this.loading = false;
        this.loadingCategories = false;
        this.loadingAllCourses = false;
        // Do NOT redirect here, let AuthGuard handle initial access.
        // If connection fails later, Moodle service should handle logout/error.
      }
      this.cdr.detectChanges();
    });

    // Load user info if connected
    this.moodleService.getCurrentUser().subscribe({
      next: (user: MoodleUser) => {
        this.userName = user.firstname || 'Estudiante';
        this.cdr.detectChanges();
      },
      error: () => {
        // Keep default name
        this.cdr.detectChanges();
      }
    });
  }

  loadMoodleData() {
    this.loading = true;
    this.moodleService.getUserCourses().subscribe({
      next: (courses) => {
        this.courses = courses.map((course, index) => ({
          id: course.id,
          title: course.fullname,
          progress: course.progress || 0,
          image: course.courseimage || this.getCourseImage(course.id),
          color: this.getCourseColor(index),
          enrolledusercount: course.enrolledusercount
        }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.courses = []; // Clear courses on error instead of showing mocks
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories() {
    this.loadingCategories = true;
    this.moodleService.getCourseCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter(cat => cat.coursecount > 0);
        this.loadingCategories = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loadingCategories = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAllCourses() {
    this.loadingAllCourses = true;
    console.log('Starting to load all courses...');

    this.moodleService.getAllCourses().subscribe({
      next: (courses) => {
        console.log('All courses loaded:', courses);
        // Filter out site course (id=1) and keep only visible courses
        this.allCourses = courses.filter(c => c.id !== 1);

        // If we have a selected category, filter by it, otherwise show all
        if (this.selectedCategory) {
          this.filteredCourses = this.allCourses.filter(c => c.categoryid === this.selectedCategory);
        } else {
          this.filteredCourses = [...this.allCourses];
        }

        console.log('Filtered courses:', this.filteredCourses);

        // Enrich enrolled courses with metadata (student count) from allCourses
        if (this.courses.length > 0) {
          this.courses = this.courses.map(course => {
            const fullDetails = this.allCourses.find(c => c.id === course.id);
            return {
              ...course,
              enrolledusercount: fullDetails?.enrolledusercount || course.enrolledusercount || 0,
              category: fullDetails?.categoryname || course.category || '',
              shortname: fullDetails?.shortname || course.shortname || ''
            };
          });
        }

        this.loadingAllCourses = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading all courses:', error);
        // Try to load from cache again or show error
        this.loadingAllCourses = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterByCategory(categoryId: number | null) {
    this.selectedCategory = categoryId;

    if (categoryId === null) {
      this.filteredCourses = [...this.allCourses];
      this.cdr.detectChanges();
    } else {
      this.loadingAllCourses = true;
      this.moodleService.getCoursesByCategory(categoryId).subscribe({
        next: (courses) => {
          this.filteredCourses = courses.filter(c => c.visible !== 0);
          this.loadingAllCourses = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error filtering courses:', error);
          this.filteredCourses = this.allCourses.filter(c => c.categoryid === categoryId);
          this.loadingAllCourses = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  getCourseImage(index: number): string {
    const images = [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80',
    ];
    return images[index % images.length];
  }

  getCourseColor(index: number): string {
    const colors = ['#7c3aed', '#a855f7', '#c084fc', '#8b5cf6', '#9333ea', '#a78bfa'];
    return colors[index % colors.length];
  }
}
