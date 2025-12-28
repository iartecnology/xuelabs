import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Moodle } from '../../services/moodle';
import { MoodleCourse } from '../../interfaces/moodle-types';
import { CourseCard } from '../course-card/course-card';

@Component({
    selector: 'app-my-courses',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, CourseCard],
    templateUrl: './my-courses.html',
    styleUrl: './my-courses.css'
})
export class MyCourses implements OnInit {
    courses: any[] = [];
    loading = true;
    // Added 'catalog' filter to show all available courses
    filter: 'all' | 'inprogress' | 'future' | 'past' | 'favourites' | 'catalog' = 'catalog';
    viewMode: 'card' | 'list' = 'card';
    searchTerm: string = '';

    constructor(
        private moodle: Moodle,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadCourses();
    }

    loadCourses() {
        this.loading = true;
        this.courses = [];

        // If 'catalog' is selected, load ALL available courses (not just enrolled)
        if (this.filter === 'catalog') {
            this.moodle.getAllCourses(true).subscribe({
                next: (courses) => {
                    this.courses = courses.map((course, index) => ({
                        ...course,
                        image: course.courseimage || this.getCourseImage(course.id),
                        progress: undefined // Catalog courses don't have progress
                    }));
                    this.loading = false;
                    this.cdr.detectChanges();
                    console.log('Loaded catalog courses:', this.courses.length);
                },
                error: (err) => {
                    console.error('Error loading catalog courses:', err);
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            // Load enrolled courses with timeline filter
            this.moodle.getEnrolledCoursesByTimeline(this.filter).subscribe({
                next: (courses) => {
                    this.courses = courses.map((course, index) => ({
                        ...course,
                        image: course.courseimage || this.getCourseImage(course.id),
                    }));
                    this.loading = false;
                    this.cdr.detectChanges();
                    console.log('Loaded enrolled courses:', this.courses.length);
                },
                error: (err) => {
                    console.error('Error loading my courses:', err);
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    onFilterChange(newFilter: 'all' | 'inprogress' | 'future' | 'past' | 'favourites' | 'catalog') {
        this.filter = newFilter;
        this.loadCourses();
    }

    toggleViewMode() {
        this.viewMode = this.viewMode === 'card' ? 'list' : 'card';
    }

    get filteredCourses() {
        if (!this.searchTerm) return this.courses;
        return this.courses.filter(c =>
            c.fullname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            c.shortname?.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    // Helpers for visuals (reuse from dashboard or create shared service later)
    getCourseImage(id: number): string {
        const images = [
            'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80',
        ];
        return images[id % images.length];
    }

    getCourseColor(index: number): string {
        const colors = ['#7c3aed', '#a855f7', '#c084fc', '#8b5cf6', '#9333ea', '#a78bfa'];
        return colors[index % colors.length];
    }
}

