import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { Moodle } from '../../services/moodle';
import { MoodleSection, MoodleModule } from '../../interfaces/moodle-types';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { AssignmentViewer } from '../assignment-viewer/assignment-viewer';
import { QuizViewer } from '../quiz-viewer/quiz-viewer';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
    selector: 'app-course-viewer',
    standalone: true,
    imports: [CommonModule, RouterLink, AssignmentViewer, QuizViewer, PdfViewerModule],
    templateUrl: './course-viewer.html',
    styleUrl: './course-viewer.css'
})
export class CourseViewer implements OnInit {
    courseId: number = 0;
    sections: MoodleSection[] = [];
    loading: boolean = true;
    error: string | null = null;
    courseTitle: string = 'Curso';
    courseProgress: number = 0; // Percentage 0-100
    courseDescription: string = '';
    safeCourseDescription: SafeHtml | null = null;
    announcements: any[] = [];
    selectedAnnouncement: any = null;
    showingDescription: boolean = false;
    loadingSafeUrl: boolean = false;

    // Selection state
    selectedModule: MoodleModule | null = null;

    // Content state
    safeHtmlContent: SafeHtml | null = null;
    safeUrl: SafeResourceUrl | null = null;

    // Content viewer state
    contentViewerType: 'none' | 'pdf' | 'video' | 'external' | 'html' | 'iframe' = 'none';
    contentViewerUrl: string = '';
    contentViewerTitle: string = '';

    // Mobile state
    isMobileIndexOpen: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private moodle: Moodle,
        private router: Router,
        private sanitizer: DomSanitizer,
        private cdr: ChangeDetectorRef
    ) { }

    toggleMobileIndex() {
        this.isMobileIndexOpen = !this.isMobileIndexOpen;
    }

    closeMobileIndex() {
        this.isMobileIndexOpen = false;
    }

    goBack() {
        this.router.navigate(['/dashboard']);
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.courseId = +params['id'];
            if (this.courseId) {
                this.loadCourseContent();
            }
        });
    }

    loadCourseContent() {
        this.loading = true;
        this.moodle.getCourseContents(this.courseId).subscribe({
            next: (contents) => {
                this.sections = contents;

                // Extract course description from section 0 (general section)
                const generalSection = contents.find(s => s.section === 0);
                if (generalSection) {
                    this.courseDescription = generalSection.summary || '';
                    // Process HTML to add authentication tokens to media URLs (like mobile app does)
                    this.safeCourseDescription = this.processMediaTokens(this.courseDescription);
                }
                this.loading = false;
                console.log('Course content loaded:', contents);
                this.calculateProgress();
                this.autoSelectFirstContent();

                // Load announcements
                this.loadAnnouncements();
            },
            error: (err) => {
                console.error('Error loading course content:', err);
                this.error = 'No se pudo cargar el contenido del curso.';
                this.loading = false;
            }
        });
    }

    loadAnnouncements() {
        this.moodle.getCourseAnnouncements(this.courseId).subscribe({
            next: (announcements) => {
                this.announcements = announcements;
                console.log('Announcements loaded:', announcements);
            },
            error: (err) => {
                console.error('Error loading announcements:', err);
            }
        });
    }

    autoSelectFirstContent() {
        // If there's a course description, show it first
        if (this.courseDescription) {
            this.selectDescription();
            return;
        }

        // Otherwise, select first module
        for (const section of this.sections) {
            if (section.modules && section.modules.length > 0) {
                for (const module of section.modules) {
                    if (module.modname !== 'label' && module.modname !== 'forum') {
                        this.selectModule(module, section.id);
                        return;
                    }
                }
            }
        }
    }

    getModuleIcon(modName: string): string {
        const icons: { [key: string]: string } = {
            'assign': '📝',
            'quiz': '✅',
            'forum': '💬',
            'resource': '📄',
            'url': '🔗',
            'page': '📃',
            'book': '📕',
            'folder': '📁',
            'label': '🏷️'
        };
        return icons[modName] || '📦';
    }

    selectModule(module: MoodleModule, sectionId: number) {
        this.selectedModule = module;
        this.showingDescription = false;
        this.selectedAnnouncement = null;
        this.safeHtmlContent = null;
        this.safeUrl = null;
        this.loadingSafeUrl = false;

        // Reset content viewer state
        this.contentViewerType = 'none';
        this.contentViewerUrl = '';
        this.contentViewerTitle = '';

        console.log('Selected module:', module);
        console.log('Module type:', module.modname);
        console.log('Has description:', !!module.description);

        const config = this.moodle.getCurrentConfig();
        if (!config) return;

        // ========================================
        // STRATEGY: Replicate Moodle Mobile App
        // ========================================
        // 1. For content modules (page, label, book): Render HTML directly
        // 2. For interactive modules (hvp, scorm, quiz): Use iframe
        // 3. For assignments: Use our custom viewer
        // 4. For resources: Download/view file
        // 5. For forums: Use iframe (will improve later)
        // 6. Fallback: Try HTML first, then iframe

        // === ASSIGNMENTS: Use custom viewer ===
        if (module.modname === 'assign') {
            // Navigate to assignment viewer (already implemented)
            console.log('Assignment detected - should navigate to assignment viewer');
            // The click handler in the template already handles this
            return;
        }

        // === RESOURCES: Use integrated viewers (like mobile app) ===
        if (module.modname === 'resource') {
            if (module.contents && module.contents[0]) {
                let fileUrl = module.contents[0].fileurl;
                if (config.token && !fileUrl.includes('token=')) {
                    const separator = fileUrl.includes('?') ? '&' : '?';
                    fileUrl = `${fileUrl}${separator}token=${config.token}`;
                }

                // Detect file type and use appropriate viewer
                const fileName = module.contents[0].filename || '';
                const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

                if (fileExt === 'pdf') {
                    this.contentViewerType = 'pdf';
                    this.contentViewerUrl = fileUrl;
                    this.contentViewerTitle = module.name;
                    return;
                } else if (['mp4', 'webm', 'ogg', 'mov'].includes(fileExt)) {
                    this.contentViewerType = 'video';
                    this.contentViewerUrl = fileUrl;
                    this.contentViewerTitle = module.name;
                    return;
                } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt)) {
                    const imageHtml = `<div class="image-viewer"><h2>${module.name}</h2><img src="${fileUrl}" alt="${fileName}" style="max-width: 100%; height: auto;"></div>`;
                    this.safeHtmlContent = this.sanitizer.bypassSecurityTrustHtml(imageHtml);
                    this.contentViewerType = 'html';
                    return;
                } else {
                    window.open(fileUrl, '_blank');
                    return;
                }
            }
        }

        // === CONTENT MODULES: Official App Logic (Data-driven) ===
        const contentModules = ['page', 'label', 'book', 'lesson', 'glossary', 'wiki'];
        if (contentModules.includes(module.modname)) {
            this.loadingSafeUrl = true;

            // 1. Logic for PAGES (mod_page)
            if (module.modname === 'page') {
                // IMPORTANT: Use module.instance (the page ID) not module.id (coursemodule ID)
                // The API returns pages with id=6,7,8... and coursemodule=46,47,48...
                // module.id is the coursemodule, module.instance is the page id
                console.log('Loading page - coursemodule:', module.id, 'instance:', module.instance);
                this.moodle.getPageContent(this.courseId, module.instance || module.id).subscribe({
                    next: (pageData) => {
                        this.loadingSafeUrl = false;
                        if (pageData && pageData.content) {
                            // Official app uses the 'content' field
                            console.log('✓ Page content received:', pageData.content.substring(0, 100));
                            this.safeHtmlContent = this.processMediaTokens(pageData.content);
                            this.contentViewerType = 'html';
                            console.log('✓ Rendering Page from API content data');
                            // Force Angular to detect the changes
                            this.cdr.detectChanges();
                        } else {
                            console.warn('No content in pageData, using fallback');
                            // Fallback: Check if there's a video/file in contents (your observation)
                            this.handleModuleResources(module);
                        }
                    },
                    error: (err) => {
                        console.error('Error loading page content:', err);
                        this.loadingSafeUrl = false;
                        this.handleModuleResources(module);
                    }
                });
                return;
            }

            // 2. Logic for BOOKS (mod_book)
            if (module.modname === 'book') {
                // IMPORTANT: Use module.instance (the book ID) not module.id (coursemodule ID)
                this.moodle.getBookContent(this.courseId, module.instance || module.id).subscribe({
                    next: (bookData) => {
                        this.loadingSafeUrl = false;
                        if (bookData) {
                            // Books are complex, but official app usually shows intro + chapters
                            this.safeHtmlContent = this.processMediaTokens(bookData.intro || module.description || '');
                            this.contentViewerType = 'html';
                        }
                    },
                    error: () => {
                        this.loadingSafeUrl = false;
                        this.safeHtmlContent = this.processMediaTokens(module.description || '');
                        this.contentViewerType = 'html';
                    }
                });
                return;
            }

            // 3. Fallback for others
            this.loadingSafeUrl = false;
            this.safeHtmlContent = this.processMediaTokens(module.description || '');
            this.contentViewerType = 'html';
            return;
        }
        // === IFRAME/INTERACTIVE MODULES: Use autologin iframe strategy ===
        const iframeModules = ['hvp', 'scorm', 'choice', 'feedback', 'survey', 'lesson'];
        if (iframeModules.includes(module.modname) || (module.modname === 'quiz' && this.isForcedEmbed(module))) {
            let directUrl = '';

            // 1. Build the base URL
            if (module.modname === 'hvp') {
                directUrl = `${config.url}/mod/hvp/embed.php?id=${module.id}`;
                if (config.token) directUrl += `&token=${config.token}`;
            } else if (module.modname === 'scorm') {
                directUrl = `${config.url}/mod/scorm/view.php?id=${module.id}`;
            } else {
                directUrl = module.url || `${config.url}/mod/${module.modname}/view.php?id=${module.id}`;
            }

            // 2. Use Auto-login mechanism to get a session
            console.log('⌛ Generating autologin session for:', module.modname);
            this.loadingSafeUrl = true;
            this.moodle.getAutologinUrl(directUrl).subscribe({
                next: (autologinUrl) => {
                    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(autologinUrl);
                    this.loadingSafeUrl = false;
                    console.log('✓ Rendering as iframe (autologin):', module.modname);
                },
                error: (err) => {
                    console.warn('Auto-login error, falling back to direct URL:', err);
                    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(directUrl);
                    this.loadingSafeUrl = false;
                }
            });
            return;
        }

        // === QUIZ MODULES: Render using QuizViewer (info/button) ===
        if (module.modname === 'quiz') {
            // Already handled by QuizViewer component in template
            console.log('✓ Rendering as QuizViewer:', module.modname);
            return;
        }

        // === FORUMS: Load discussions and render as HTML (like mobile app) ===
        if (module.modname === 'forum') {
            this.loadForumContent(module.instance);
            return;
        }

        // === URL MODULES: Handle external/internal links ===
        if (module.modname === 'url') {
            if (module.contents && module.contents[0]) {
                let urlContent = module.contents[0].fileurl;

                if (urlContent.includes('pluginfile.php') && config.token) {
                    const separator = urlContent.includes('?') ? '&' : '?';
                    urlContent = `${urlContent}${separator}token=${config.token}`;
                }

                if (urlContent.includes(config.url)) {
                    this.contentViewerType = 'iframe';
                    this.loadingSafeUrl = true;
                    this.moodle.getAutologinUrl(urlContent).subscribe({
                        next: (url) => {
                            this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
                            this.loadingSafeUrl = false;
                        },
                        error: () => {
                            this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlContent);
                            this.loadingSafeUrl = false;
                        }
                    });
                    this.contentViewerTitle = module.name;
                    console.log('✓ Opening internal URL in iframe (autologin):', urlContent);
                } else {
                    this.contentViewerType = 'external';
                    this.contentViewerUrl = urlContent;
                    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlContent);
                    this.contentViewerTitle = module.name;
                    console.log('✓ Opening external URL in controlled viewer:', urlContent);
                }
            }
            return;
        }

        // === FALLBACK STRATEGY (like mobile app) ===
        if (module.description && module.description.trim().length > 0) {
            this.safeHtmlContent = this.processMediaTokens(module.description);
            return;
        }

        // Last resort: iframe with autologin
        let fallbackUrl = module.url || `${config.url}/mod/${module.modname}/view.php?id=${module.id}`;
        if (fallbackUrl) {
            this.loadingSafeUrl = true;
            this.moodle.getAutologinUrl(fallbackUrl).subscribe({
                next: (url) => {
                    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
                    this.loadingSafeUrl = false;
                },
                error: () => {
                    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fallbackUrl);
                    this.loadingSafeUrl = false;
                }
            });
            console.log('✓ Rendering as iframe (fallback autologin):', module.modname);
        } else {
            console.warn('⚠ No rendering method available for module:', module.modname);
        }

    }

    selectDescription() {
        this.selectedModule = null;
        this.showingDescription = true;
        this.selectedAnnouncement = null;
        this.safeHtmlContent = null;
        this.safeUrl = null;
    }

    selectAnnouncement(announcement: any) {
        this.selectedModule = null;
        this.showingDescription = false;
        this.selectedAnnouncement = announcement;
        this.safeHtmlContent = this.processMediaTokens(announcement.message);
        this.safeUrl = null;
    }

    handleModuleResources(module: MoodleModule) {
        if (!module.contents || module.contents.length === 0) {
            this.safeHtmlContent = this.processMediaTokens(module.description || 'Sin contenido disponible.');
            this.contentViewerType = 'html';
            return;
        }

        const mainFile = module.contents[0];
        const fileExt = mainFile.filename.split('.').pop()?.toLowerCase() || '';
        const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileExt);
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
        const config = this.moodle.getCurrentConfig();

        if (isVideo) {
            console.log('✓ Rendering resource as Video Player');
            this.contentViewerType = 'video';
            this.contentViewerUrl = mainFile.fileurl;
            if (config?.token) {
                const sep = this.contentViewerUrl.includes('?') ? '&' : '?';
                this.contentViewerUrl += `${sep}token=${config.token}`;
            }
            this.contentViewerTitle = module.name;
        } else if (isImage) {
            console.log('✓ Rendering resource as Image Viewer');
            const fileUrl = config?.token ? `${mainFile.fileurl}${mainFile.fileurl.includes('?') ? '&' : '?'}token=${config.token}` : mainFile.fileurl;
            const imageHtml = `<div class="image-viewer"><h2>${module.name}</h2><img src="${fileUrl}" alt="${mainFile.filename}" style="max-width: 100%; height: auto;"></div>`;
            this.safeHtmlContent = this.sanitizer.bypassSecurityTrustHtml(imageHtml);
            this.contentViewerType = 'html';
        } else {
            // Default to description
            this.safeHtmlContent = this.processMediaTokens(module.description || 'Contenido disponible como archivo descargable.');
            this.contentViewerType = 'html';
        }
    }

    processMediaTokens(html: string): SafeHtml {
        const config = this.moodle.getCurrentConfig();

        // If no config or token, still process HTML for iframes
        let processedHtml = html;

        // 1. Replace @@PLUGINFILE@@ placeholders (standard in Moodle)
        if (processedHtml.includes('@@PLUGINFILE@@') && config?.url) {
            const pluginfileUrl = `${config.url}/webservice/pluginfile.php`;
            processedHtml = processedHtml.replace(/@@PLUGINFILE@@/g, pluginfileUrl);
        }

        // 2. Process HTML in a temp DOM element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedHtml;

        // 3. Add tokens to images and videos from Moodle
        if (config?.token) {
            const mediaElements = tempDiv.querySelectorAll('img, video, audio, source');
            mediaElements.forEach((element) => {
                const srcAttr = element.getAttribute('src');
                if (srcAttr && srcAttr.includes('pluginfile.php')) {
                    if (!srcAttr.includes('token=') && !srcAttr.includes('wstoken=')) {
                        const separator = srcAttr.includes('?') ? '&' : '?';
                        element.setAttribute('src', `${srcAttr}${separator}token=${config.token}`);
                    }
                }
            });
        }

        // 4. Convert video tags with YouTube URLs to proper YouTube embeds
        // Some Moodle content has: <video><source src="https://youtu.be/xxx"></video>
        // This doesn't work because YouTube requires its embed player
        const allVideos = tempDiv.querySelectorAll('video');
        allVideos.forEach((video) => {
            // Check if this video has YouTube sources
            const sources = video.querySelectorAll('source');
            let youtubeVideoId: string | null = null;

            sources.forEach((source) => {
                const src = source.getAttribute('src') || '';
                const extractedId = this.extractYouTubeVideoId(src);
                if (extractedId) {
                    youtubeVideoId = extractedId;
                }
            });

            // Also check the video src attribute directly
            const videoSrc = video.getAttribute('src') || '';
            if (!youtubeVideoId) {
                youtubeVideoId = this.extractYouTubeVideoId(videoSrc);
            }

            if (youtubeVideoId) {
                // Replace the video element with a YouTube embed
                const wrapper = document.createElement('div');
                wrapper.className = 'video-embed-wrapper';
                wrapper.style.cssText = 'position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 20px 0; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';

                const iframe = document.createElement('iframe');
                // Use youtube-nocookie.com for privacy mode and add parameters to minimize branding
                // modestbranding=1 - reduces YouTube logo
                // rel=0 - don't show related videos at end
                // showinfo=0 - hide video title (deprecated but some browsers still respect it)
                // iv_load_policy=3 - hide annotations
                iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`;
                iframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 12px;';
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
                iframe.setAttribute('title', 'YouTube video player');
                iframe.setAttribute('frameborder', '0');

                wrapper.appendChild(iframe);

                // Replace the video element with our YouTube embed
                const parent = video.parentNode;
                if (parent) {
                    parent.replaceChild(wrapper, video);
                }

                console.log('✓ Converted video tag with YouTube URL to embed:', youtubeVideoId);
            } else {
                // Regular video - just ensure it has controls and is responsive
                video.setAttribute('controls', 'true');
                video.style.width = '100%';
                video.style.maxWidth = '100%';
            }
        });

        // 5. Handle iframes (YouTube, Vimeo, etc.) - Make them responsive
        const allIframes = tempDiv.querySelectorAll('iframe');
        allIframes.forEach((iframe) => {
            const src = iframe.getAttribute('src') || '';

            // Check if it's a video embed (YouTube, Vimeo, etc.)
            const isVideoEmbed = src.includes('youtube.com') ||
                src.includes('youtu.be') ||
                src.includes('vimeo.com') ||
                src.includes('dailymotion.com');

            if (isVideoEmbed) {
                // For YouTube iframes, modify the URL to reduce branding
                if (src.includes('youtube.com') || src.includes('youtu.be')) {
                    let newSrc = src;

                    // Convert youtube.com to youtube-nocookie.com for privacy mode
                    newSrc = newSrc.replace('www.youtube.com', 'www.youtube-nocookie.com');
                    newSrc = newSrc.replace('youtube.com', 'www.youtube-nocookie.com');

                    // Add parameters to minimize branding if not already present
                    if (!newSrc.includes('modestbranding')) {
                        const separator = newSrc.includes('?') ? '&' : '?';
                        newSrc = `${newSrc}${separator}modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`;
                    }

                    iframe.setAttribute('src', newSrc);
                }

                // Create a responsive wrapper for video iframes (if not already wrapped)
                if (!iframe.parentElement?.classList.contains('video-embed-wrapper')) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'video-embed-wrapper';
                    wrapper.style.cssText = 'position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 20px 0; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';

                    // Style the iframe
                    iframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 12px;';

                    // Ensure proper attributes for embedded content
                    iframe.setAttribute('allowfullscreen', 'true');
                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');

                    // Replace fixed dimensions with responsive
                    iframe.removeAttribute('width');
                    iframe.removeAttribute('height');

                    // Wrap the iframe
                    const parent = iframe.parentNode;
                    if (parent) {
                        parent.insertBefore(wrapper, iframe);
                        wrapper.appendChild(iframe);
                    }
                }

                console.log('✓ Processed YouTube/Video iframe:', src.substring(0, 50) + '...');
            } else {
                // For other iframes, just ensure they're responsive
                iframe.style.maxWidth = '100%';
                iframe.style.border = 'none';
            }
        });

        // Return the processed HTML (bypass security for trusted content from API)
        return this.sanitizer.bypassSecurityTrustHtml(tempDiv.innerHTML);
    }

    // Helper method to extract YouTube video ID from various URL formats
    private extractYouTubeVideoId(url: string): string | null {
        if (!url) return null;

        // Patterns for YouTube URLs:
        // - https://www.youtube.com/watch?v=VIDEO_ID
        // - https://youtu.be/VIDEO_ID
        // - https://www.youtube.com/embed/VIDEO_ID
        // - https://youtube.com/v/VIDEO_ID

        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/ // Just the video ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }



    openModule(module: MoodleModule) {
        if (module.url) {
            window.open(module.url, '_blank');
        }
    }

    // Allow user to try embedding if they fixed the server config
    forcedEmbedIds: Set<number> = new Set();

    forceEmbed(module: MoodleModule) {
        this.forcedEmbedIds.add(module.id);

        // Regenerate safeUrl logic
        if (module.modname === 'hvp') {
            const config = this.moodle.getCurrentConfig();
            if (config) {
                const embedUrl = `${config.url}/mod/hvp/view.php?id=${module.id}&predict=1`;
                this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
            }
        }
    }

    isForcedEmbed(module: MoodleModule): boolean {
        return this.forcedEmbedIds.has(module.id);
    }

    // Helper to verify if we can embed this module type
    isEmbeddable(modName: string): boolean {
        // Now we try to embed everything except assign (has custom component) and resource (download link)
        return !['assign', 'resource', 'label'].includes(modName);
    }

    // Calculate overall course progress
    calculateProgress(): void {
        let totalModules = 0;
        let completedModules = 0;

        this.sections.forEach(section => {
            section.modules?.forEach(module => {
                // Skip labels and non-completable items
                if (module.modname === 'label') return;

                totalModules++;
                if (module.completiondata?.state === 1) {
                    completedModules++;
                }
            });
        });

        this.courseProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    }

    // Toggle completion status for a module
    toggleCompletion(module: MoodleModule, event: Event): void {
        event.stopPropagation(); // Prevent module selection

        // Check if completion is enabled and manual
        if (!module.completiondata || module.completiondata.tracking !== 1) {
            console.log('Module does not support manual completion');
            return;
        }

        const newState = module.completiondata.state === 1 ? 0 : 1;

        this.moodle.updateActivityCompletion(module.id, newState === 1).subscribe({
            next: () => {
                // Update local state
                if (module.completiondata) {
                    module.completiondata.state = newState;
                }
                this.calculateProgress();
            },
            error: (err) => {
                console.error('Error updating completion:', err);
            }
        });
    }

    // Check if module completion can be toggled manually
    canToggleCompletion(module: MoodleModule): boolean {
        return module.completiondata?.tracking === 1; // 1 = manual, 2 = automatic
    }

    // Get flat list of all navigable modules
    private getAllModules(): MoodleModule[] {
        const modules: MoodleModule[] = [];
        this.sections.forEach(section => {
            section.modules?.forEach(module => {
                if (module.modname !== 'label') {
                    modules.push(module);
                }
            });
        });
        return modules;
    }

    // Navigate to previous module
    goToPrevious(): void {
        const modules = this.getAllModules();
        if (!this.selectedModule || modules.length === 0) return;

        const currentIndex = modules.findIndex(m => m.id === this.selectedModule!.id);
        if (currentIndex > 0) {
            const prevModule = modules[currentIndex - 1];
            const section = this.sections.find(s => s.modules?.some(m => m.id === prevModule.id));
            if (section) {
                this.selectModule(prevModule, section.id);
            }
        }
    }

    // Navigate to next module
    goToNext(): void {
        const modules = this.getAllModules();
        if (!this.selectedModule || modules.length === 0) return;

        const currentIndex = modules.findIndex(m => m.id === this.selectedModule!.id);
        if (currentIndex < modules.length - 1) {
            const nextModule = modules[currentIndex + 1];
            const section = this.sections.find(s => s.modules?.some(m => m.id === nextModule.id));
            if (section) {
                this.selectModule(nextModule, section.id);
            }
        }
    }

    // Check if there's a previous module
    hasPrevious(): boolean {
        const modules = this.getAllModules();
        if (!this.selectedModule || modules.length === 0) return false;
        const currentIndex = modules.findIndex(m => m.id === this.selectedModule!.id);
        return currentIndex > 0;
    }

    // Check if there's a next module
    hasNext(): boolean {
        const modules = this.getAllModules();
        if (!this.selectedModule || modules.length === 0) return false;
        const currentIndex = modules.findIndex(m => m.id === this.selectedModule!.id);
        return currentIndex < modules.length - 1;
    }

    // Get current module position (1-indexed)
    getCurrentPosition(): number {
        const modules = this.getAllModules();
        if (!this.selectedModule || modules.length === 0) return 0;
        const currentIndex = modules.findIndex(m => m.id === this.selectedModule!.id);
        return currentIndex + 1;
    }

    // Get total number of modules
    getTotalModules(): number {
        return this.getAllModules().length;
    }

    // Close content viewer and return to normal view
    closeContentViewer(): void {
        this.contentViewerType = 'none';
        this.contentViewerUrl = '';
        this.contentViewerTitle = '';
    }

    // Load forum discussions and render as HTML
    loadForumContent(forumId: number): void {
        console.log('Loading forum discussions for forum ID:', forumId);

        this.moodle.getForumDiscussions(forumId).subscribe({
            next: (discussions: any[]) => {
                console.log('Forum discussions loaded:', discussions);

                if (!discussions || discussions.length === 0) {
                    this.safeHtmlContent = this.sanitizer.bypassSecurityTrustHtml(
                        '<div class="forum-empty"><p>No hay discusiones en este foro aún.</p></div>'
                    );
                    return;
                }

                // Build HTML from discussions
                let html = '<div class="forum-discussions">';
                html += '<h2 class="forum-title">💬 Discusiones del Foro</h2>';

                discussions.forEach((discussion: any) => {
                    const date = new Date(discussion.timemodified * 1000);
                    const dateStr = date.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    html += `
                        <div class="discussion-item">
                            <div class="discussion-header">
                                <h3 class="discussion-title">${discussion.name}</h3>
                                <div class="discussion-meta">
                                    <span class="discussion-author">👤 ${discussion.userfullname}</span>
                                    <span class="discussion-date">📅 ${dateStr}</span>
                                </div>
                            </div>
                            <div class="discussion-message">
                                ${discussion.message}
                            </div>
                        </div>
                    `;
                });

                html += '</div>';

                // Process with tokens and sanitize
                this.safeHtmlContent = this.processMediaTokens(html);
            },
            error: (err: any) => {
                console.error('Error loading forum discussions:', err);
                this.safeHtmlContent = this.sanitizer.bypassSecurityTrustHtml(
                    '<div class="forum-error"><p>❌ Error al cargar las discusiones del foro.</p></div>'
                );
            }
        });
    }
}
