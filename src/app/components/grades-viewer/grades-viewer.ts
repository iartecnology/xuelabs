import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Moodle } from '../../services/moodle';

interface GradeItem {
    id: number;
    itemname: string;
    itemtype: string;
    itemmodule: string;
    graderaw: number | null;
    gradeformatted: string;
    grademax: number;
    grademin: number;
    feedback: string;
    dategraded: number;
    percentage: number;
}

@Component({
    selector: 'app-grades-viewer',
    standalone: true,
    imports: [CommonModule, DatePipe],
    templateUrl: './grades-viewer.html',
    styleUrls: ['./grades-viewer.css']
})
export class GradesViewer implements OnInit {
    @Input() courseId!: number;

    gradeItems: GradeItem[] = [];
    filteredGrades: GradeItem[] = [];
    loading: boolean = true;
    error: string | null = null;

    // Statistics
    courseGrade: number = 0;
    courseTotal: number = 0;
    gradedCount: number = 0;
    totalCount: number = 0;
    highestGrade: number = 0;
    lowestGrade: number = 100;

    // UI State
    selectedFilter: 'all' | 'graded' | 'pending' = 'all';
    expandedItem: number | null = null;

    constructor(
        private moodle: Moodle,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        // Get courseId from route if not provided as input
        if (!this.courseId) {
            this.route.params.subscribe(params => {
                this.courseId = +params['id'];
                this.loadGrades();
            });
        } else {
            this.loadGrades();
        }
    }

    loadGrades() {
        this.loading = true;
        this.error = null;

        console.log('Loading grades for course:', this.courseId);

        this.moodle.getCourseGrades(this.courseId).subscribe({
            next: (grades: any[]) => {
                console.log('Grades API response:', grades);
                console.log('Grades length:', grades.length);

                this.gradeItems = grades.map((item: any) => ({
                    id: item.id,
                    itemname: item.itemname,
                    itemtype: item.itemtype,
                    itemmodule: item.itemmodule || '',
                    graderaw: item.graderaw,
                    gradeformatted: item.gradeformatted || '-',
                    grademax: item.grademax,
                    grademin: item.grademin,
                    feedback: item.feedback || '',
                    dategraded: item.dategraded || 0,
                    percentage: this.calculatePercentage(item.graderaw, item.grademax)
                }));

                console.log('Processed grade items:', this.gradeItems);

                this.calculateStatistics();
                this.filterGrades(this.selectedFilter);
                this.loading = false;

                // Force Angular to detect changes
                this.cdr.detectChanges();

                console.log('Loading complete. Filtered grades:', this.filteredGrades.length);
            },
            error: (err: any) => {
                console.error('Error loading grades:', err);
                this.error = 'No se pudieron cargar las calificaciones. Por favor, intenta de nuevo.';
                this.loading = false;
            }
        });
    }

    calculatePercentage(grade: number | null, max: number): number {
        if (grade === null || max === 0) return 0;
        return Math.round((grade / max) * 100);
    }

    calculateStatistics() {
        let totalGrade = 0;
        let totalMax = 0;
        let count = 0;
        let gradedItems = 0;
        let highest = 0;
        let lowest = 100;

        this.gradeItems.forEach(item => {
            if (item.itemtype !== 'course') {
                this.totalCount++;

                if (item.graderaw !== null) {
                    totalGrade += item.graderaw;
                    totalMax += item.grademax;
                    gradedItems++;

                    if (item.percentage > highest) highest = item.percentage;
                    if (item.percentage < lowest) lowest = item.percentage;
                }
            }
        });

        this.gradedCount = gradedItems;
        this.highestGrade = gradedItems > 0 ? highest : 0;
        this.lowestGrade = gradedItems > 0 ? lowest : 0;

        if (totalMax > 0) {
            this.courseGrade = Math.round((totalGrade / totalMax) * 100);
            this.courseTotal = totalMax;
        }
    }

    filterGrades(filter: 'all' | 'graded' | 'pending') {
        this.selectedFilter = filter;

        switch (filter) {
            case 'all':
                this.filteredGrades = this.gradeItems.filter(item => item.itemtype !== 'course');
                break;
            case 'graded':
                this.filteredGrades = this.gradeItems.filter(item =>
                    item.itemtype !== 'course' && item.graderaw !== null
                );
                break;
            case 'pending':
                this.filteredGrades = this.gradeItems.filter(item =>
                    item.itemtype !== 'course' && item.graderaw === null
                );
                break;
        }
    }

    toggleExpand(itemId: number) {
        this.expandedItem = this.expandedItem === itemId ? null : itemId;
    }

    getExpandedItem(): GradeItem | undefined {
        return this.gradeItems.find(item => item.id === this.expandedItem);
    }

    getGradeColor(percentage: number): string {
        if (percentage >= 90) return '#10b981'; // green
        if (percentage >= 70) return '#3b82f6'; // blue
        if (percentage >= 50) return '#f59e0b'; // orange
        return '#ef4444'; // red
    }

    getGradeIcon(percentage: number): string {
        if (percentage >= 90) return '🌟';
        if (percentage >= 70) return '✅';
        if (percentage >= 50) return '📝';
        if (percentage > 0) return '📉';
        return '⏳';
    }

    getModuleIcon(modname: string): string {
        const icons: { [key: string]: string } = {
            'assign': '📝',
            'quiz': '❓',
            'forum': '💬',
            'resource': '📄',
            'url': '🔗',
            'page': '📃',
            'book': '📚',
            'lesson': '📖',
            'scorm': '🎮',
            'hvp': '🎯',
            'feedback': '📊'
        };
        return icons[modname] || '📌';
    }
}
