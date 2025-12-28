import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Moodle, MoodleConfig } from '../../services/moodle';
import { ThemeService, ThemeColor } from '../../services/theme';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-api-config',
  imports: [FormsModule, CommonModule],
  templateUrl: './api-config.html',
  styleUrl: './api-config.css',
})
export class ApiConfig implements OnInit {
  config: MoodleConfig = {
    url: 'https://iartecnology.com/xuelabs',
    token: '05c991de502797a9957bb1863571a868',
    autoConnect: true
  };

  testing = false;
  testResult: 'success' | 'error' | null = null;
  errorMessage = '';

  availableThemes: ThemeColor[] = [];
  currentTheme = 'violet';
  customColor = '#000000';
  currentLogo = '';
  currentIcon = '';
  currentAppName = '';

  // Admin Section
  currentUser: any = null;
  categories: any[] = [];
  allCourses: any[] = [];
  expandedCategories: Set<number> = new Set<number>();
  activeTab: 'config' | 'admin' = 'config';

  // Category Form
  newCatName = '';
  newCatParent = 0;
  newCatDesc = '';

  // Course Form
  newCourseFullname = '';
  newCourseShortname = '';
  newCourseCategory = 0;
  newCourseSummary = '';

  adminMessage = '';
  adminError = '';
  missingCapabilities: string[] = [];

  // PWA Install
  deferredPrompt: any;
  showInstallBtn = false;
  isIOS = false;
  showIOSInstructions = false;

  // Cropper State
  showCropper = false;
  croppingImage: string | null = null;
  zoom = 1;
  posX = 0;
  posY = 0;
  isDragging = false;
  startX = 0;
  startY = 0;
  cropType: 'logo' | 'icon' = 'icon';

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: any) {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    this.deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    this.showInstallBtn = true;
  }

  constructor(
    private moodleService: Moodle,
    public themeService: ThemeService
  ) {
    this.availableThemes = this.themeService.themes;
  }

  ngOnInit() {
    this.moodleService.config$.subscribe(config => {
      if (config) {
        this.config = { ...config };
      }
    });

    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    this.themeService.customColorSubject.subscribe(color => {
      this.customColor = color;
    });

    this.themeService.currentLogo$.subscribe(logo => {
      this.currentLogo = logo;
    });

    this.themeService.currentIcon$.subscribe(icon => {
      this.currentIcon = icon;
    });

    this.themeService.currentAppName$.subscribe(name => {
      this.currentAppName = name;
    });

    this.moodleService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      if (user && user.userissiteadmin) {
        this.loadCategories();
        this.checkAdminCapabilities();
      }
    });

    this.checkPlatform();
  }

  checkPlatform() {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    this.isIOS = /iphone|ipad|ipod/.test(userAgent);

    // If it's iOS and not already in standalone mode, show instructions
    const isStandalone = ('standalone' in (window as any).navigator) && ((window as any).navigator.standalone);
    if (this.isIOS && !isStandalone) {
      this.showIOSInstructions = true;
    }
  }

  checkAdminCapabilities() {
    this.missingCapabilities = [];
    const required = ['core_course_create_categories', 'core_course_create_courses'];
    required.forEach(cap => {
      if (!this.moodleService.hasCapability(cap)) {
        this.missingCapabilities.push(cap);
      }
    });
  }

  loadCategories() {
    this.moodleService.getCategories().subscribe(cats => {
      this.categories = cats;
      if (this.categories.length > 0 && this.newCourseCategory === 0) {
        this.newCourseCategory = this.categories[0].id;
      }
    });
    this.loadAllCourses();
  }

  loadAllCourses(forceRefresh: boolean = false) {
    this.moodleService.getAllCourses(forceRefresh).subscribe(courses => {
      this.allCourses = courses;
    });
  }

  toggleCategory(categoryId: number) {
    if (this.expandedCategories.has(categoryId)) {
      this.expandedCategories.delete(categoryId);
    } else {
      this.expandedCategories.add(categoryId);
    }
  }

  isCategoryExpanded(categoryId: number): boolean {
    return this.expandedCategories.has(categoryId);
  }

  setTheme(themeName: string) {
    this.themeService.setTheme(themeName);
  }

  onCustomColorChange(event: any) {
    const color = event.target.value;
    this.themeService.setCustomPalette(color);
  }

  onLogoFileSelected(event: any) {
    this.openCropper(event, 'logo');
  }

  onIconFileSelected(event: any) {
    this.openCropper(event, 'icon');
  }

  openCropper(event: any, type: 'logo' | 'icon') {
    const file = event.target.files[0];
    if (file) {
      this.cropType = type;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.croppingImage = e.target.result;
        this.showCropper = true;
        this.zoom = 1;
        this.posX = 0;
        this.posY = 0;
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    event.target.value = '';
  }

  closeCropper() {
    this.showCropper = false;
    this.croppingImage = null;
  }

  handleMouseDown(e: MouseEvent | TouchEvent) {
    this.isDragging = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    this.startX = clientX - this.posX;
    this.startY = clientY - this.posY;
  }

  @HostListener('window:mousemove', ['$event'])
  handleMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    this.posX = e.clientX - this.startX;
    this.posY = e.clientY - this.startY;
  }

  @HostListener('window:touchmove', ['$event'])
  handleTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    this.posX = e.touches[0].clientX - this.startX;
    this.posY = e.touches[0].clientY - this.startY;
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  handleMouseUp() {
    this.isDragging = false;
  }

  applyCrop() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set fixed size for icon or logo
      const size = this.cropType === 'icon' ? 512 : 800;
      canvas.width = size;
      canvas.height = this.cropType === 'icon' ? size : size * 0.3; // Aspect ratio for logo

      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image applying zoom and position
        // This is a simple implementation: 
        // We calculate how the image fits in the canvas
        const imgRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;

        let drawW, drawH;
        if (imgRatio > canvasRatio) {
          drawH = canvas.height * this.zoom;
          drawW = drawH * imgRatio;
        } else {
          drawW = canvas.width * this.zoom;
          drawH = drawW / imgRatio;
        }

        const x = (canvas.width - drawW) / 2 + this.posX;
        const y = (canvas.height - drawH) / 2 + this.posY;

        ctx.drawImage(img, x, y, drawW, drawH);

        const croppedData = canvas.toDataURL('image/png');
        if (this.cropType === 'icon') {
          this.themeService.setIcon(croppedData);
        } else {
          this.themeService.setLogo(croppedData);
        }
        this.closeCropper();
      }
    };
    img.src = this.croppingImage!;
  }

  resetLogo() {
    this.themeService.resetLogo();
  }

  resetIcon() {
    this.themeService.resetIcon();
  }

  updateAppName(name: string) {
    this.themeService.setAppName(name);
  }

  saveConfig() {
    this.testing = true;
    this.testResult = null;
    this.errorMessage = '';

    this.moodleService.saveConfig(this.config).subscribe({
      next: () => {
        this.testing = false;
        this.testResult = 'success';
        setTimeout(() => this.testResult = null, 5000);
      },
      error: (error) => {
        this.testing = false;
        this.testResult = 'error';
        this.errorMessage = error.message || 'Error al conectar con Moodle. Verifica la URL y el token.';
      }
    });
  }

  // Admin Methods
  createCategory() {
    console.log('Attempting to create category:', this.newCatName, 'under parent:', this.newCatParent);
    if (!this.newCatName) {
      this.adminError = 'El nombre de la categoría es obligatorio.';
      return;
    }

    this.adminMessage = 'Creando categoría...';
    this.moodleService.createCategory(this.newCatName, +this.newCatParent, this.newCatDesc).subscribe({
      next: (response) => {
        console.log('Category created successfully:', response);
        this.adminMessage = 'Categoría creada con éxito';
        this.adminError = '';
        this.loadCategories();
        this.loadAllCourses(true);
        this.newCatName = '';
        this.newCatDesc = '';
        setTimeout(() => this.adminMessage = '', 3000);
      },
      error: (err) => {
        console.error('Moodle Service Error (Category):', err);
        this.adminMessage = '';
        this.adminError = err.message || 'Error al crear la categoría. Verifica permisos de administrador.';
        setTimeout(() => this.adminError = '', 8000);
      }
    });
  }

  createCourse() {
    console.log('Attempting to create course:', this.newCourseFullname);
    if (!this.newCourseFullname || !this.newCourseShortname) {
      this.adminError = 'Nombre y ID corto son obligatorios.';
      return;
    }

    this.adminMessage = 'Creando curso...';
    this.moodleService.createCourse(this.newCourseFullname, this.newCourseShortname, +this.newCourseCategory, this.newCourseSummary).subscribe({
      next: (response) => {
        console.log('Course created successfully:', response);
        this.adminMessage = 'Curso creado con éxito';
        this.adminError = '';
        this.loadAllCourses(true);
        this.newCourseFullname = '';
        this.newCourseShortname = '';
        this.newCourseSummary = '';
        setTimeout(() => this.adminMessage = '', 3000);
      },
      error: (err) => {
        console.error('Moodle Service Error (Course):', err);
        this.adminMessage = '';
        this.adminError = err.message || 'Error al crear el curso. Revisa el ID corto.';
        setTimeout(() => this.adminError = '', 8000);
      }
    });
  }

  installPWA() {
    if (!this.deferredPrompt) return;
    // Show the install prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      } else {
        console.log('User dismissed the PWA install prompt');
      }
      this.deferredPrompt = null;
      this.showInstallBtn = false;
    });
  }
}
