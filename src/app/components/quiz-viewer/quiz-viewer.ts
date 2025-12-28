import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Moodle } from '../../services/moodle';

@Component({
  selector: 'app-quiz-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-container glass-panel">
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando cuestionario...</p>
      </div>

      <div *ngIf="error" class="error-state">
        <p>{{ error }}</p>
        <p class="debug-info">Course: {{courseId}}, Instance: {{instanceId}}</p>
      </div>

      <div *ngIf="!loading && !quiz && !error" class="empty-state">
        <p>No se encontraron datos para este cuestionario.</p>
      </div>

      <div *ngIf="!loading && quiz" class="quiz-content">
        <div class="quiz-header">
          <h2>{{ quiz.name }}</h2>
          <div class="quiz-intro" [innerHTML]="quiz.intro"></div>
        </div>

        <div class="quiz-info">
          <div class="info-item">
            <span class="label">Intentos permitidos:</span>
            <span class="value">{{ quiz.attempts === 0 ? 'Sin límite' : quiz.attempts }}</span>
          </div>
          <div class="info-item" *ngIf="quiz.timeclose > 0">
            <span class="label">Cierra:</span>
            <span class="value">{{ quiz.timeclose * 1000 | date:'medium' }}</span>
          </div>
          <div class="info-item" *ngIf="quiz.timelimit > 0">
             <span class="label">Límite de tiempo:</span>
             <span class="value">{{ quiz.timelimit / 60 }} min</span>
          </div>
        </div>

        <div class="quiz-actions">
           <p class="note">Para realizar el cuestionario, por favor usa la versión web por ahora.</p>
           <a [href]="getWebUrl()" target="_blank" class="btn-primary">Ir al Cuestionario Web</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quiz-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .quiz-header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }
    .quiz-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
      background: rgba(255,255,255,0.5);
      padding: 1rem;
      border-radius: var(--radius-md);
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .label {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .value {
      font-weight: 500;
      color: var(--text-main);
    }
    .quiz-actions {
      text-align: center;
    }
    .btn-primary {
      display: inline-block;
      background: var(--primary-600);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-full);
      text-decoration: none;
      font-weight: 500;
      margin-top: 1rem;
    }
    .note {
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
  `]
})
export class QuizViewer implements OnInit {
  @Input() courseId!: number;
  @Input() instanceId!: number; // cmid or instance id? usually instance id for mod specific calls

  quiz: any = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(private moodle: Moodle) { }

  ngOnInit() {
    this.loadQuiz();
  }

  webUrl: string = '#';

  loadQuiz() {
    this.loading = true;
    this.moodle.callMoodleFunctionPublic('mod_quiz_get_quizzes_by_courses', { courseids: [this.courseId] })
      .subscribe({
        next: (response: any) => {
          if (response.quizzes) {
            this.quiz = response.quizzes.find((q: any) => q.id === this.instanceId);
            if (this.quiz) {
              const target = `${this.moodle.getCurrentConfig()?.url}/mod/quiz/view.php?id=${this.quiz.coursemodule}`;
              this.moodle.getAutologinUrl(target).subscribe(url => this.webUrl = url);
            }
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading quiz', err);
          this.error = 'Error al cargar detalles del cuestionario. Verifica permisos.';
          this.loading = false;
        }
      });
  }

  getWebUrl(): string {
    return this.webUrl;
  }
}
