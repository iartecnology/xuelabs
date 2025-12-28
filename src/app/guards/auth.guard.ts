import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanActivateFn } from '@angular/router';
import { Moodle } from '../services/moodle';

export const authGuard: CanActivateFn = (route, state) => {
    const moodle = inject(Moodle);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    // If running on server (SSR), allow navigation to proceed
    // The client-side guard will run again and check localStorage
    if (!isBrowser) {
        return true;
    }

    // Check localStorage directly for immediate access on client
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const savedConfig = localStorage.getItem('moodle_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                if (config && config.token) {
                    return true;
                }
            } catch (e) {
                console.error('Error parsing moodle config:', e);
            }
        }
    }

    // No valid config found, redirect to login
    return router.createUrlTree(['/login']);
};
