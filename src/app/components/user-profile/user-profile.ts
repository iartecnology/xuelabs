import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Moodle } from '../../services/moodle';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './user-profile.html',
    styleUrl: './user-profile.css'
})
export class UserProfile implements OnInit {
    user: any = null;
    loading: boolean = true;
    error: string | null = null;

    // Edit mode
    editMode: boolean = false;
    editedUser: any = {};
    saving: boolean = false;
    saveSuccess: boolean = false;
    saveError: string | null = null;

    // Password change
    showPasswordChange: boolean = false;
    currentPassword: string = '';
    newPassword: string = '';
    confirmPassword: string = '';
    changingPassword: boolean = false;
    passwordChangeSuccess: boolean = false;
    passwordChangeError: string | null = null;

    // Preferences
    preferences: any = {};

    constructor(private moodle: Moodle, private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.loadUserProfile();
    }

    loadUserProfile() {
        this.loading = true;
        this.error = null;

        // Optimized: Use cached site info instead of making new request
        this.moodle.getSiteInfo().subscribe({
            next: (siteInfo: any) => {
                this.user = {
                    id: siteInfo.userid,
                    fullname: siteInfo.fullname,
                    email: siteInfo.useremail || '',
                    profileimageurl: siteInfo.userpictureurl || '',
                    username: siteInfo.username || '',
                    firstname: siteInfo.firstname || '',
                    lastname: siteInfo.lastname || '',
                    sitename: siteInfo.sitename || ''
                };

                this.editedUser = { ...this.user };
                this.loading = false;
                this.cdr.detectChanges(); // Force UI update

                console.log('User profile loaded:', this.user);
            },
            error: (err: any) => {
                console.error('Error loading user profile:', err);
                this.error = 'No se pudo cargar el perfil de usuario.';
                this.loading = false;
                this.cdr.detectChanges(); // Force UI update
            }
        });
    }

    loadUserPreferences() {
        // Load preferences in background, don't block UI
        this.moodle.getUserPreferences().subscribe({
            next: (prefs: any) => {
                this.preferences = prefs;
                console.log('User preferences loaded:', prefs);
            },
            error: (err: any) => {
                console.error('Error loading preferences:', err);
            }
        });
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        if (this.editMode) {
            this.editedUser = { ...this.user };
            this.saveSuccess = false;
            this.saveError = null;
        }
    }

    cancelEdit() {
        this.editMode = false;
        this.editedUser = { ...this.user };
        this.saveError = null;
    }

    saveProfile() {
        this.saving = true;
        this.saveSuccess = false;
        this.saveError = null;

        const updateData = {
            firstname: this.editedUser.firstname,
            lastname: this.editedUser.lastname,
            email: this.editedUser.email
        };

        this.moodle.updateUserProfile(this.user.id, updateData).subscribe({
            next: () => {
                this.user = { ...this.editedUser };
                this.saving = false;
                this.saveSuccess = true;
                this.editMode = false;

                setTimeout(() => {
                    this.saveSuccess = false;
                }, 3000);

                console.log('Profile updated successfully');
            },
            error: (err: any) => {
                console.error('Error updating profile:', err);
                this.saveError = 'No se pudo actualizar el perfil. Verifica que tengas permisos.';
                this.saving = false;
            }
        });
    }

    togglePasswordChange() {
        this.showPasswordChange = !this.showPasswordChange;
        if (this.showPasswordChange) {
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';
            this.passwordChangeSuccess = false;
            this.passwordChangeError = null;
        }
    }

    changePassword() {
        // Validation
        if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
            this.passwordChangeError = 'Por favor completa todos los campos.';
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.passwordChangeError = 'Las contraseñas nuevas no coinciden.';
            return;
        }

        if (this.newPassword.length < 8) {
            this.passwordChangeError = 'La contraseña debe tener al menos 8 caracteres.';
            return;
        }

        this.changingPassword = true;
        this.passwordChangeSuccess = false;
        this.passwordChangeError = null;

        this.moodle.changePassword(this.currentPassword, this.newPassword).subscribe({
            next: () => {
                this.changingPassword = false;
                this.passwordChangeSuccess = true;
                this.showPasswordChange = false;

                // Clear fields
                this.currentPassword = '';
                this.newPassword = '';
                this.confirmPassword = '';

                setTimeout(() => {
                    this.passwordChangeSuccess = false;
                }, 5000);

                console.log('Password changed successfully');
            },
            error: (err: any) => {
                console.error('Error changing password:', err);
                this.passwordChangeError = err.message || 'No se pudo cambiar la contraseña.';
                this.changingPassword = false;
            }
        });
    }

    logout() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            this.moodle.logout();
        }
    }

    getInitials(): string {
        if (!this.user) return '?';
        const first = this.user.firstname?.charAt(0) || '';
        const last = this.user.lastname?.charAt(0) || '';
        return (first + last).toUpperCase() || this.user.fullname?.charAt(0).toUpperCase() || '?';
    }
}
