import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Moodle } from '../../services/moodle';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class Login {
    readonly url: string = 'https://iartecnology.com/xuelabs'; // Fixed from configuration
    username: string = '';
    password: string = '';
    isLoading: boolean = false;
    error: string | null = null;
    showPassword: boolean = false;

    constructor(
        private moodle: Moodle,
        private router: Router
    ) { }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    async onSubmit() {
        if (!this.url || !this.username || !this.password) {
            this.error = 'Por favor completa todos los campos';
            return;
        }

        this.isLoading = true;
        this.error = null;

        // Clean URL
        let cleanUrl = this.url.trim();
        if (cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }

        this.moodle.login(cleanUrl, this.username, this.password).subscribe({
            next: () => {
                this.isLoading = false;
                this.router.navigate(['/']);
            },
            error: (err) => {
                this.isLoading = false;
                console.error(err);
                this.error = 'Error de autenticación. Verifica tus credenciales y que el servicio web esté habilitado.';
            }
        });
    }
}
