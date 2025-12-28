import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Moodle } from '../../services/moodle';
import { MoodleAssignment } from '../../interfaces/moodle-types';

@Component({
    selector: 'app-assignment-viewer',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe, FormsModule],
    templateUrl: './assignment-viewer.html',
    styleUrl: './assignment-viewer.css'
})
export class AssignmentViewer implements OnInit {
    @Input() courseId: number = 0;
    @Input() assignmentId: number = 0;

    cmId: number = 0;
    assignment: MoodleAssignment | null = null;
    submissionStatus: any = null;
    loading: boolean = true;
    error: string | null = null;

    // Submission form
    submissionText: string = '';
    isSubmitting: boolean = false;
    showEditor: boolean = false;

    // Success/Error messages
    successMessage: string | null = null;
    errorMessage: string | null = null;

    constructor(
        private route: ActivatedRoute,
        public moodle: Moodle,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        if (this.courseId && (this.assignmentId || this.cmId)) {
            this.loadAssignment();
        } else {
            this.route.params.subscribe(params => {
                const cId = +params['courseId'];
                const cmId = +params['cmid'];

                if (cId && cmId) {
                    this.courseId = cId;
                    this.cmId = cmId;
                    this.loadAssignment();
                }
            });
        }
    }

    loadAssignment() {
        this.loading = true;
        this.moodle.getAssignments(this.courseId).subscribe({
            next: (assignments) => {
                if (this.assignmentId) {
                    this.assignment = assignments.find(a => a.id === this.assignmentId) || null;
                } else if (this.cmId) {
                    this.assignment = assignments.find(a => a.cmid === this.cmId) || null;
                }

                if (this.assignment) {
                    this.assignmentId = this.assignment.id;
                    this.cmId = this.assignment.cmid;
                    this.loadSubmissionStatus();
                } else {
                    this.error = 'Tarea no encontrada.';
                    this.loading = false;
                }
            },
            error: (err) => {
                console.error('Error loading assignments:', err);
                this.error = 'Error al cargar la tarea.';
                this.loading = false;
            }
        });
    }

    loadSubmissionStatus() {
        this.moodle.getSubmissionStatus(this.assignmentId).subscribe({
            next: (status) => {
                this.submissionStatus = status;

                // Load existing submission text if any
                if (status?.lastattempt?.submission?.plugins) {
                    const onlineTextPlugin = status.lastattempt.submission.plugins.find(
                        (p: any) => p.type === 'onlinetext'
                    );
                    if (onlineTextPlugin?.editorfields) {
                        this.submissionText = onlineTextPlugin.editorfields[0]?.text || '';
                    }
                }

                this.loading = false;
                this.cdr.detectChanges();
                console.log('Submission Status:', status);
            },
            error: (err) => {
                console.error('Error loading submission status:', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    // Submission methods
    toggleEditor() {
        this.showEditor = !this.showEditor;
        this.clearMessages();
    }

    saveDraft() {
        if (!this.submissionText.trim()) {
            this.errorMessage = 'Por favor escribe algo antes de guardar.';
            return;
        }

        this.isSubmitting = true;
        this.clearMessages();

        this.moodle.saveSubmission(this.assignmentId, this.submissionText).subscribe({
            next: () => {
                this.successMessage = '✅ Borrador guardado correctamente.';
                this.isSubmitting = false;
                this.loadSubmissionStatus(); // Reload to get updated status
            },
            error: (err) => {
                console.error('Error saving draft:', err);
                this.errorMessage = '❌ Error al guardar el borrador.';
                this.isSubmitting = false;
            }
        });
    }

    submitAssignment() {
        if (!this.submissionText.trim()) {
            this.errorMessage = 'Por favor escribe tu entrega antes de enviar.';
            return;
        }

        if (!confirm('¿Estás seguro de que quieres enviar esta tarea? No podrás modificarla después.')) {
            return;
        }

        this.isSubmitting = true;
        this.clearMessages();

        // First save the submission
        this.moodle.saveSubmission(this.assignmentId, this.submissionText).subscribe({
            next: () => {
                // Then submit for grading
                this.moodle.submitForGrading(this.assignmentId).subscribe({
                    next: () => {
                        this.successMessage = '🎉 ¡Tarea enviada correctamente!';
                        this.isSubmitting = false;
                        this.showEditor = false;
                        this.loadSubmissionStatus(); // Reload to show submitted status
                    },
                    error: (err) => {
                        console.error('Error submitting for grading:', err);
                        this.errorMessage = '❌ Error al enviar la tarea.';
                        this.isSubmitting = false;
                    }
                });
            },
            error: (err) => {
                console.error('Error saving submission:', err);
                this.errorMessage = '❌ Error al guardar la entrega.';
                this.isSubmitting = false;
            }
        });
    }

    clearMessages() {
        this.successMessage = null;
        this.errorMessage = null;
    }

    // Helper methods
    isSubmitted(): boolean {
        return this.submissionStatus?.lastattempt?.submission?.status === 'submitted';
    }

    getGrade(): string | null {
        return this.submissionStatus?.feedback?.grade?.gradeformatted || null;
    }

    getSubmissionDate(): number | null {
        return this.submissionStatus?.lastattempt?.submission?.timemodified || null;
    }

    getFeedback(): string | null {
        const feedback = this.submissionStatus?.feedback?.plugins?.find(
            (p: any) => p.type === 'comments'
        );
        return feedback?.editorfields?.[0]?.text || null;
    }

    isOverdue(): boolean {
        if (!this.assignment?.duedate) return false;
        return Date.now() / 1000 > this.assignment.duedate && !this.isSubmitted();
    }

    canEdit(): boolean {
        // Can edit if not submitted
        return !this.isSubmitted();
    }

    getStatusBadge(): { text: string; class: string } {
        if (this.getGrade()) {
            return { text: 'Calificado', class: 'graded' };
        }
        if (this.isSubmitted()) {
            return { text: 'Entregado', class: 'submitted' };
        }
        if (this.isOverdue()) {
            return { text: 'Retrasado', class: 'overdue' };
        }
        return { text: 'Pendiente', class: 'pending' };
    }
}
