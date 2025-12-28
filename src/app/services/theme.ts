import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface ThemeColor {
    name: string;
    label: string;
    colors: {
        [key: string]: string;
    }
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private isBrowser: boolean;

    // Palettes based on Tailwind colors
    public themes: ThemeColor[] = [
        {
            name: 'violet',
            label: 'Morado (Original)',
            colors: {
                '50': '#f5f3ff',
                '100': '#ede9fe',
                '200': '#ddd6fe',
                '300': '#c4b5fd',
                '400': '#a78bfa',
                '500': '#8b5cf6',
                '600': '#7c3aed',
                '700': '#6d28d9',
                '800': '#5b21b6',
                '900': '#4c1d95',
            }
        },
        {
            name: 'blue',
            label: 'Azul Océano',
            colors: {
                '50': '#eff6ff',
                '100': '#dbeafe',
                '200': '#bfdbfe',
                '300': '#93c5fd',
                '400': '#60a5fa',
                '500': '#3b82f6',
                '600': '#2563eb',
                '700': '#1d4ed8',
                '800': '#1e40af',
                '900': '#1e3a8a',
            }
        },
        {
            name: 'emerald',
            label: 'Verde Esmeralda',
            colors: {
                '50': '#ecfdf5',
                '100': '#d1fae5',
                '200': '#a7f3d0',
                '300': '#6ee7b7',
                '400': '#34d399',
                '500': '#10b981',
                '600': '#059669',
                '700': '#047857',
                '800': '#065f46',
                '900': '#064e3b',
            }
        },
        {
            name: 'rose',
            label: 'Rosa Intenso',
            colors: {
                '50': '#fff1f2',
                '100': '#ffe4e6',
                '200': '#fecdd3',
                '300': '#fda4af',
                '400': '#fb7185',
                '500': '#f43f5e',
                '600': '#e11d48',
                '700': '#be123c',
                '800': '#9f1239',
                '900': '#881337',
            }
        },
        {
            name: 'amber',
            label: 'Ámbar / Naranja',
            colors: {
                '50': '#fffbeb',
                '100': '#fef3c7',
                '200': '#fde68a',
                '300': '#fcd34d',
                '400': '#fbbf24',
                '500': '#f59e0b',
                '600': '#d97706',
                '700': '#b45309',
                '800': '#92400e',
                '900': '#78350f',
            }
        },
        {
            name: 'slate',
            label: 'Gris Ejecutivo',
            colors: {
                '50': '#f8fafc',
                '100': '#f1f5f9',
                '200': '#e2e8f0',
                '300': '#cbd5e1',
                '400': '#94a3b8',
                '500': '#64748b',
                '600': '#475569',
                '700': '#334155',
                '800': '#1e293b',
                '900': '#0f172a',
            }
        }
    ];

    private currentThemeSubject = new BehaviorSubject<string>('violet');
    public currentTheme$ = this.currentThemeSubject.asObservable();
    public customColorSubject = new BehaviorSubject<string>('#000000');

    // Logo Management
    private defaultLogo = 'https://iartecnology.com/xuelabs/pluginfile.php/1/theme_edumy/headerlogo1/1764817509/xuelab.png';
    public currentLogoSubject = new BehaviorSubject<string>(this.defaultLogo);
    public currentLogo$ = this.currentLogoSubject.asObservable();

    // Icon Management
    private defaultIcon = 'favicon.ico';
    public currentIconSubject = new BehaviorSubject<string>(this.defaultIcon);
    public currentIcon$ = this.currentIconSubject.asObservable();

    // App Name Management
    private defaultAppName = 'XUeLABS';
    public currentAppNameSubject = new BehaviorSubject<string>(this.defaultAppName);
    public currentAppName$ = this.currentAppNameSubject.asObservable();

    constructor(@Inject(PLATFORM_ID) platformId: Object) {
        this.isBrowser = isPlatformBrowser(platformId);
        this.loadTheme();
    }

    setTheme(themeName: string) {
        if (!this.isBrowser) return;

        if (themeName === 'custom') {
            const savedColor = localStorage.getItem('app_custom_color') || '#000000';
            this.setCustomPalette(savedColor);
            return;
        }

        const theme = this.themes.find(t => t.name === themeName) || this.themes[0];

        const root = document.documentElement;
        Object.keys(theme.colors).forEach(key => {
            root.style.setProperty(`--primary-${key}`, theme.colors[key]);
        });

        localStorage.setItem('app_theme', themeName);
        this.currentThemeSubject.next(themeName);
    }

    setCustomPalette(hex: string) {
        if (!this.isBrowser) return;

        // Ensure hex format
        if (!hex.startsWith('#')) hex = '#' + hex;

        const [h, s, l] = this.hexToHSL(hex);

        const palette = {
            '50': this.hslToHex(h, s, 97),
            '100': this.hslToHex(h, s, 94),
            '200': this.hslToHex(h, s, 86),
            '300': this.hslToHex(h, s, 77),
            '400': this.hslToHex(h, s, 68),
            '500': hex,
            '600': this.hslToHex(h, s, Math.max(10, l * 0.9)), // Slightly darker bases
            '700': this.hslToHex(h, s, Math.max(10, l * 0.75)),
            '800': this.hslToHex(h, s, Math.max(10, l * 0.6)),
            '900': this.hslToHex(h, s, Math.max(5, l * 0.45)),
        };

        const root = document.documentElement;
        Object.keys(palette).forEach(key => {
            root.style.setProperty(`--primary-${key}`, palette[key as keyof typeof palette]);
        });

        localStorage.setItem('app_theme', 'custom');
        localStorage.setItem('app_custom_color', hex);

        this.currentThemeSubject.next('custom');
        this.customColorSubject.next(hex);
    }

    // Logo Methods
    setLogo(logoUrl: string) {
        if (!this.isBrowser) return;
        localStorage.setItem('app_logo', logoUrl);
        this.currentLogoSubject.next(logoUrl);
    }

    resetLogo() {
        if (!this.isBrowser) return;
        localStorage.removeItem('app_logo');
        this.currentLogoSubject.next(this.defaultLogo);
    }

    setIcon(iconUrl: string) {
        if (!this.isBrowser) return;
        localStorage.setItem('app_icon', iconUrl);
        this.currentIconSubject.next(iconUrl);
    }

    resetIcon() {
        if (!this.isBrowser) return;
        localStorage.removeItem('app_icon');
        this.currentIconSubject.next(this.defaultIcon);
    }

    setAppName(name: string) {
        if (!this.isBrowser) return;
        localStorage.setItem('app_name', name);
        this.currentAppNameSubject.next(name);
    }

    getCurrentTheme(): string {
        return this.currentThemeSubject.value;
    }

    private loadTheme() {
        if (!this.isBrowser) return;
        const savedTheme = localStorage.getItem('app_theme');
        if (savedTheme === 'custom') {
            const savedColor = localStorage.getItem('app_custom_color') || '#000000';
            this.setCustomPalette(savedColor);
        } else if (savedTheme) {
            this.setTheme(savedTheme);
        }

        // Load Logo
        const savedLogo = localStorage.getItem('app_logo');
        if (savedLogo) {
            this.currentLogoSubject.next(savedLogo);
        }

        // Load Icon
        const savedIcon = localStorage.getItem('app_icon');
        if (savedIcon) {
            this.currentIconSubject.next(savedIcon);
        }

        // Load App Name
        const savedName = localStorage.getItem('app_name');
        if (savedName) {
            this.currentAppNameSubject.next(savedName);
        }
    }

    // --- Color Utilities ---

    private hexToHSL(H: string): [number, number, number] {
        let r = 0, g = 0, b = 0;
        if (H.length == 4) {
            r = parseInt("0x" + H[1] + H[1]);
            g = parseInt("0x" + H[2] + H[2]);
            b = parseInt("0x" + H[3] + H[3]);
        } else if (H.length == 7) {
            r = parseInt("0x" + H[1] + H[2]);
            g = parseInt("0x" + H[3] + H[4]);
            b = parseInt("0x" + H[5] + H[6]);
        }
        r /= 255;
        g /= 255;
        b /= 255;
        const cmin = Math.min(r, g, b),
            cmax = Math.max(r, g, b),
            delta = cmax - cmin;
        let h = 0, s = 0, l = 0;

        if (delta == 0)
            h = 0;
        else if (cmax == r)
            h = ((g - b) / delta) % 6;
        else if (cmax == g)
            h = (b - r) / delta + 2;
        else
            h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        if (h < 0) h += 360;

        l = (cmax + cmin) / 2;
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);

        return [h, s, l];
    }

    private hslToHex(h: number, s: number, l: number): string {
        s /= 100;
        l /= 100;

        let c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
            m = l - c / 2,
            r = 0,
            g = 0,
            b = 0;

        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        const toHex = (n: number) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }
}
