import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap, timeout } from 'rxjs/operators';
import {
  MoodleCourse,
  MoodleCategory,
  MoodleUser,
  MoodleSection,
  MoodleAssignment,
  MoodleForum,
  MoodleDiscussion,
  MoodleGradeItem,
  MoodleTable,
  MoodleConversation,
  MoodleMessage,
  MoodleNotification,
  MoodleCalendarEvent
} from '../interfaces/moodle-types';

export interface MoodleConfig {
  url: string;
  token: string;
  autoConnect: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Moodle {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private configSubject = new BehaviorSubject<MoodleConfig | null>(null);
  public config$ = this.configSubject.asObservable();

  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadConfig();
  }



  private loadConfig(): void {
    if (!this.isBrowser) return;

    const savedConfig = localStorage.getItem('moodle_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      this.configSubject.next(config);
      if (config.autoConnect) {
        this.testConnection(config).subscribe();
      }
    }
  }

  saveConfig(config: MoodleConfig): Observable<boolean> {
    if (this.isBrowser) {
      localStorage.setItem('moodle_config', JSON.stringify(config));
    }
    this.configSubject.next(config);
    return this.testConnection(config);
  }

  login(url: string, username: string, password: string, service: string = 'moodle_mobile_app'): Observable<boolean> {
    const tokenUrl = `${url}/login/token.php`;
    const params = new HttpParams()
      .set('username', username)
      .set('password', password)
      .set('service', service);

    return this.http.get<{ token: string, error?: string }>(tokenUrl, { params }).pipe(
      switchMap(response => {
        if (response.error) {
          throw new Error(response.error);
        }
        if (response.token) {
          const config: MoodleConfig = {
            url: url,
            token: response.token,
            autoConnect: true
          };

          // Validate token by testing connection
          return this.testConnection(config).pipe(
            map(() => {
              // Only save config if connection test succeeds
              if (this.isBrowser) {
                localStorage.setItem('moodle_config', JSON.stringify(config));
              }
              this.configSubject.next(config);
              return true;
            })
          );
        }
        throw new Error('No token received');
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  testConnection(config?: MoodleConfig): Observable<boolean> {
    const currentConfig = config || this.configSubject.value;
    if (!currentConfig) {
      return throwError(() => new Error('No configuration found'));
    }

    return this.callMoodleFunction('core_webservice_get_site_info', {}, currentConfig).pipe(
      timeout(10000),
      map((response: any) => {
        this.connectedSubject.next(true);
        return true;
      }),
      catchError((error) => {
        console.warn('Connection test failed:', error);
        this.connectedSubject.next(false);
        // If auto-connect fails, maybe we should not throw error but just return false
        // so app can handle it gracefully.
        return of(false);
      })
    );
  }

  // --- Core & User ---

  getCurrentUser(): Observable<MoodleUser> {
    const config = this.configSubject.value;
    if (!config) {
      return throwError(() => new Error('Not configured'));
    }

    return this.callMoodleFunction('core_webservice_get_site_info', {}, config).pipe(
      map((response: any) => {
        // Save available functions for capability checking
        if (response.functions) {
          const functions = response.functions.map((f: any) => f.name);
          if (this.isBrowser) {
            localStorage.setItem('moodle_functions', JSON.stringify(functions));
          }
        }

        return {
          id: response.userid,
          username: response.username || '',
          firstname: response.firstname || '',
          lastname: response.lastname || '',
          fullname: response.fullname,
          email: response.useremail || '',
          profileimageurl: response.userpictureurl || '',
          userissiteadmin: response.userissiteadmin,
          roles: response.userissiteadmin ? 'Administrador' : 'Estudiante' // Simple role mapping
        };
      })
    );
  }

  hasCapability(functionName: string): boolean {
    if (!this.isBrowser) return true;
    const functionsStr = localStorage.getItem('moodle_functions');
    if (!functionsStr) return false;
    try {
      const functions = JSON.parse(functionsStr);
      return Array.isArray(functions) && functions.includes(functionName);
    } catch {
      return false;
    }
  }

  getSiteInfo(): Observable<any> {
    const config = this.configSubject.value;
    if (!config) {
      return throwError(() => new Error('Not configured'));
    }

    return this.callMoodleFunction('core_webservice_get_site_info', {}, config);
  }

  logout(): void {
    // Clear configuration
    this.configSubject.next(null);
    this.connectedSubject.next(false);

    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('moodle_config');
    }

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // --- Course Management ---

  getUserCourses(): Observable<MoodleCourse[]> {
    return this.getEnrolledCoursesByTimeline('all');
  }

  // Cache removed to allow proper filtering by classification
  // private enrolledCoursesCache: MoodleCourse[] | null = null;

  // Optimized method
  getEnrolledCoursesByTimeline(classification: 'all' | 'inprogress' | 'future' | 'past' | 'favourites' = 'all', limit: number = 0): Observable<MoodleCourse[]> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    // Cache removed: We need to hit the API to respect the 'classification' filter.
    // If we return cached 'all' courses when requesting 'future', filters won't work.

    return this.callMoodleFunction('core_course_get_enrolled_courses_by_timeline_classification', {
      classification: classification,
      limit: limit,
      offset: 0,
      sort: 'fullname'
    }, config).pipe(
      timeout(15000), // Timeout after 15s
      map((response: any) => {
        const courses = response.courses || [];
        const mappedCourses = courses.map((course: any) => ({
          id: course.id,
          fullname: course.fullname,
          shortname: course.shortname,
          summary: course.summary || '',
          progress: course.progress || 0,
          categoryname: course.categoryname,
          startdate: course.startdate,
          enddate: course.enddate,
          courseimage: course.courseimage,
          enrolledusercount: course.enrolledusercount
        }));

        // No caching here anymore
        return mappedCourses;
      }),
      catchError(err => {
        console.warn('Timeline API failed, falling back to standard fetch', err);
        return this.callMoodleFunction('core_enrol_get_users_courses', { userid: 0 }, config).pipe(
          map((courses: any[]) => {
            const mapped = courses.map(course => ({
              id: course.id,
              fullname: course.fullname,
              shortname: course.shortname,
              summary: course.summary || '',
              progress: course.progress || 0,
              categoryname: course.categoryname
            }));
            // Cache removed
            return mapped;
          })
        );
      })
    );
  }

  getCourseCategories(): Observable<MoodleCategory[]> {
    const config = this.configSubject.value;
    if (!config) {
      return throwError(() => new Error('Not configured'));
    }

    return this.callMoodleFunction('core_course_get_categories', {}, config).pipe(
      map((categories: any[]) => {
        return categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || '',
          descriptionformat: cat.descriptionformat,
          parent: cat.parent,
          sortorder: cat.sortorder,
          coursecount: cat.coursecount,
          depth: cat.depth,
          path: cat.path
        }));
      })
    );
  }

  // Cache for all courses list
  private allCoursesCache: MoodleCourse[] | null = null;

  getAllCourses(forceRefresh: boolean = false): Observable<MoodleCourse[]> {
    const config = this.configSubject.value;
    if (!config) {
      return throwError(() => new Error('Not configured'));
    }

    // Check memory cache
    if (this.allCoursesCache && !forceRefresh) {
      console.log('Returning cached courses list');
      return of(this.allCoursesCache);
    }

    // Check disk cache
    if (this.isBrowser && !forceRefresh) {
      const stored = localStorage.getItem('all_courses_cache');
      if (stored) {
        try {
          this.allCoursesCache = JSON.parse(stored);
          // Return cached but update in bg
          this.fetchAllCourses(config).subscribe();
          return of(this.allCoursesCache!);
        } catch (e) { }
      }
    }

    return this.fetchAllCourses(config);
  }

  private fetchAllCourses(config: MoodleConfig): Observable<MoodleCourse[]> {
    // First get all categories, then get courses for each category
    return this.getCourseCategories().pipe(
      switchMap(categories => {
        if (categories.length === 0) {
          return of([]);
        }

        // Create an array of observables for each category's courses
        const courseRequests = categories.map(cat =>
          this.getCoursesByCategory(cat.id).pipe(
            catchError(() => of([])) // Return empty array if category fails
          )
        );

        // Combine all requests and flatten the results
        return forkJoin(courseRequests).pipe(
          map(coursesArrays => {
            // Flatten array of arrays into single array
            const allCourses: MoodleCourse[] = [];
            coursesArrays.forEach(courses => {
              allCourses.push(...courses);
            });
            // Update caches
            this.allCoursesCache = allCourses;
            if (this.isBrowser) {
              localStorage.setItem('all_courses_cache', JSON.stringify(allCourses));
            }
            return allCourses;
          })
        );
      })
    );
  }

  getCoursesByCategory(categoryId: number): Observable<MoodleCourse[]> {
    const config = this.configSubject.value;
    if (!config) {
      return throwError(() => new Error('Not configured'));
    }

    return this.callMoodleFunction('core_course_get_courses_by_field', {
      field: 'category',
      value: categoryId
    }, config).pipe(
      map((response: any) => {
        const courses = response.courses || [];
        return courses.map((course: any) => ({
          id: course.id,
          fullname: course.fullname,
          shortname: course.shortname,
          summary: course.summary || '',
          summaryformat: course.summaryformat,
          categoryid: course.categoryid || course.category, // Support different Moodle versions
          categoryname: course.categoryname,
          enrolledusercount: course.enrolledusercount,
          visible: course.visible,
          format: course.format,
          startdate: course.startdate,
          enddate: course.enddate
        }));
      })
    );
  }

  // Cache for course contents
  private courseContentCache = new Map<number, MoodleSection[]>();

  getCourseContents(courseId: number): Observable<MoodleSection[]> {
    const config = this.configSubject.value;
    if (!config) {
      return throwError(() => new Error('Not configured'));
    }

    // Check memory cache first
    if (this.courseContentCache.has(courseId)) {
      console.log(`Returning memory cached content for course ${courseId}`);
      return of(this.courseContentCache.get(courseId)!);
    }

    // Check localStorage cache
    if (this.isBrowser) {
      const stored = localStorage.getItem(`course_content_${courseId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.courseContentCache.set(courseId, parsed);
          console.log(`Returning disk cached content for course ${courseId}`);

          // Return cached version immediately BUT fetch update in background
          this.fetchAndCacheContent(courseId, config).subscribe();

          return of(parsed);
        } catch (e) {
          console.error('Error parsing cached content', e);
        }
      }
    }

    console.log(`Fetching content for course ${courseId}...`);
    return this.fetchAndCacheContent(courseId, config);
  }

  private fetchAndCacheContent(courseId: number, config: MoodleConfig): Observable<MoodleSection[]> {
    return this.callMoodleFunction('core_course_get_contents', {
      courseid: courseId
    }, config).pipe(
      map(sections => {
        // Update caches
        this.courseContentCache.set(courseId, sections);
        if (this.isBrowser) {
          try {
            localStorage.setItem(`course_content_${courseId}`, JSON.stringify(sections));
          } catch (e) {
            console.error('Error saving to localStorage (quota exceeded?)', e);
          }
        }
        return sections;
      })
    );
  }

  enrolInCourse(courseId: number): Observable<boolean> {
    const config = this.configSubject.value;
    if (!config) {
      return throwError(() => new Error('Not configured'));
    }
    return this.callMoodleFunction('enrol_self_enrol_user', {
      courseid: courseId
    }, config).pipe(map(() => true));
  }

  // --- Activities ---

  getAssignments(courseId: number): Observable<MoodleAssignment[]> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('mod_assign_get_assignments', {
      courseids: [courseId]
    }, config).pipe(
      map((response: any) => {
        if (response.courses && response.courses.length > 0) {
          return response.courses[0].assignments;
        }
        return [];
      })
    );
  }

  getAssignmentStatus(assignId: number): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('mod_assign_get_assignments', {
      assignmentids: [assignId]
    }, config).pipe(
      map((response: any) => {
        if (response.courses && response.courses[0] && response.courses[0].assignments) {
          return response.courses[0].assignments[0];
        }
        return null;
      })
    );
  }

  getCourseGrades(courseId: number): Observable<any[]> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('gradereport_user_get_grade_items', {
      courseid: courseId
    }, config).pipe(
      map((response: any) => {
        return response.usergrades && response.usergrades[0]
          ? response.usergrades[0].gradeitems
          : [];
      }),
      catchError((error) => {
        console.error('Error fetching grades:', error);
        return of([]);
      })
    );
  }

  // Assignment Submission APIs
  getSubmissionStatus(assignId: number): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('mod_assign_get_submission_status', {
      assignid: assignId
    }, config).pipe(
      catchError((error) => {
        console.error('Error fetching submission status:', error);
        return of(null);
      })
    );
  }

  saveSubmission(assignId: number, text: string): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('mod_assign_save_submission', {
      assignmentid: assignId,
      plugindata: {
        onlinetext_editor: {
          text: text,
          format: 1, // HTML format
          itemid: 0
        }
      }
    }, config);
  }

  submitForGrading(assignId: number): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('mod_assign_submit_for_grading', {
      assignmentid: assignId,
      acceptsubmissionstatement: 1
    }, config);
  }

  // Forum APIs
  getForumDiscussions(forumId: number): Observable<any[]> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('mod_forum_get_forum_discussions', {
      forumid: forumId,
      sortorder: -1, // Most recent first
      page: 0,
      perpage: 20
    }, config).pipe(
      map((response: any) => response.discussions || []),
      catchError((error) => {
        console.error('Error fetching forum discussions:', error);
        return of([]);
      })
    );
  }

  // User Profile APIs
  getUserProfile(userId?: number): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('core_user_get_users_by_field', {
      field: 'id',
      values: [userId || 0] // 0 = current user
    }, config).pipe(
      map((response: any) => response[0] || null),
      catchError((error) => {
        console.error('Error fetching user profile:', error);
        return throwError(() => error);
      })
    );
  }

  updateUserProfile(userId: number, profileData: any): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('core_user_update_users', {
      users: [{
        id: userId,
        ...profileData
      }]
    }, config).pipe(
      catchError((error) => {
        console.error('Error updating user profile:', error);
        return throwError(() => error);
      })
    );
  }

  uploadUserPicture(userId: number, file: File): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    // This would require multipart/form-data upload
    // For now, return a placeholder
    return throwError(() => new Error('File upload not implemented yet'));
  }

  getUserPreferences(): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('core_user_get_user_preferences', {}, config).pipe(
      map((response: any) => response.preferences || {}),
      catchError((error) => {
        console.error('Error fetching user preferences:', error);
        return of({});
      })
    );
  }

  setUserPreferences(preferences: any): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('core_user_set_user_preferences', {
      preferences: Object.keys(preferences).map(key => ({
        name: key,
        value: preferences[key]
      }))
    }, config);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    // Get current user ID first
    return this.getSiteInfo().pipe(
      switchMap((siteInfo: any) => {
        return this.callMoodleFunction('core_user_update_users', {
          users: [{
            id: siteInfo.userid,
            password: newPassword,
            preferences: [{
              type: 'auth_forcepasswordchange',
              value: '0'
            }]
          }]
        }, config);
      }),
      catchError((error) => {
        console.error('Error changing password:', error);
        return throwError(() => new Error('No se pudo cambiar la contraseña. Verifica que la contraseña actual sea correcta.'));
      })
    );
  }

  updateActivityCompletion(cmid: number, completed: boolean): Observable<boolean> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('core_completion_update_activity_completion_status_manually', {
      cmid: cmid,
      completed: completed ? 1 : 0
    }, config).pipe(
      map(() => true)
    );
  }

  getCourseAnnouncements(courseId: number): Observable<any[]> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    // Get forums for the course
    return this.callMoodleFunction('mod_forum_get_forums_by_courses', {
      courseids: [courseId]
    }, config).pipe(
      switchMap((response: any) => {
        // Find the news forum (type = 'news')
        const newsForum = response.find((forum: any) => forum.type === 'news');

        if (!newsForum) {
          return of([]);
        }

        // Get discussions from news forum
        return this.callMoodleFunction('mod_forum_get_forum_discussions', {
          forumid: newsForum.id,
          sortorder: -1, // Sort by most recent
          page: 0,
          perpage: 5 // Get last 5 announcements
        }, config).pipe(
          map((discussions: any) => discussions.discussions || [])
        );
      }),
      catchError(() => of([]))
    );
  }


  getAutologinUrl(targetUrl: string): Observable<string> {
    const config = this.configSubject.value;
    if (!config || !config.token) return throwError(() => new Error('Not configured'));

    console.log('[Autologin] Requesting key for:', targetUrl);
    // 1. Get the autologin key from Moodle
    return this.callMoodleFunction('tool_mobile_get_autologin_key', {
      wstoken: config.token
    }, config).pipe(
      timeout(8000), // Max 8 seconds for the key
      map((response: any) => {
        console.log('[Autologin] Response received:', !!response.key);
        if (response.key && response.autologinurl) {
          // 2. Build the final URL: autologin.php?key=...&userid=...&url=target
          // Note: Moodle's response already contains key and autologinurl
          const autologinUrl = response.autologinurl;
          const key = response.key;

          // Moodle redirects to 'url' parameter after setting the session cookie
          const finalUrl = `${autologinUrl}?key=${key}&url=${encodeURIComponent(targetUrl)}`;
          return finalUrl;
        }
        throw new Error('No se pudo generar la clave de auto-login');
      }),
      catchError(err => {
        console.warn('[Autologin] Error or Timeout, falling back to direct URL:', err.message || err);
        // Fallback: return direct URL (will show login page if needed, but app won't hang)
        return of(targetUrl);
      })
    );
  }

  // --- Content Specific API (Official App Logic) ---

  getPageContent(courseId: number, instanceId: number): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('mod_page_get_pages_by_courses', { courseids: [courseId] }, config).pipe(
      map((response: any) => {
        const pages = response.pages || [];
        return pages.find((p: any) => p.id === instanceId || p.coursemodule === instanceId);
      })
    );
  }

  getBookContent(courseId: number, instanceId: number): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('mod_book_get_books_by_courses', { courseids: [courseId] }, config).pipe(
      map((response: any) => {
        const books = response.books || [];
        return books.find((b: any) => b.id === instanceId || b.coursemodule === instanceId);
      })
    );
  }

  // --- Helper ---

  getFileContent(url: string): Observable<string> {
    const config = this.configSubject.value;
    if (!config || !config.token) return throwError(() => new Error('Not configured'));

    // Ensure token is attached
    let finalUrl = url;
    if (!finalUrl.includes('token=') && !finalUrl.includes('wstoken=')) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${separator}token=${config.token}`;
    }

    console.log('[FileContent] Fetching content:', finalUrl.substring(0, 100) + '...');
    return this.http.get(finalUrl, { responseType: 'text' }).pipe(
      timeout(10000), // Max 10 seconds
      catchError(err => {
        console.error('[FileContent] Error fetching file:', err);
        return throwError(() => err);
      })
    );
  }

  getCurrentConfig(): MoodleConfig | null {
    return this.configSubject.value;
  }

  // Temporary public accessor for components
  public callMoodleFunctionPublic(functionName: string, params: any): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));
    return this.callMoodleFunction(functionName, params, config);
  }

  private callMoodleFunction(function_name: string, params: any, config: MoodleConfig): Observable<any> {
    const url = `${config.url}/webservice/rest/server.php`;
    console.log(`[Moodle API] Calling: ${function_name}`, params);

    let httpParams = new HttpParams()
      .set('wstoken', config.token)
      .set('wsfunction', function_name)
      .set('moodlewsrestformat', 'json');

    // Recursive helper to handle nested parameters for Moodle (objects and arrays)
    const buildMoodleParams = (data: any, currentParams: HttpParams, prefix = ''): HttpParams => {
      if (data === null || data === undefined) return currentParams;
      Object.keys(data).forEach(key => {
        const value = data[key];
        const fullKey = prefix ? `${prefix}[${key}]` : key;
        if (typeof value === 'object' && value !== null) {
          currentParams = buildMoodleParams(value, currentParams, fullKey);
        } else {
          currentParams = currentParams.set(fullKey, value !== undefined ? value : '');
        }
      });
      return currentParams;
    };

    httpParams = buildMoodleParams(params, httpParams);

    // Using POST as it's more reliable for write operations and handles larger payloads
    return this.http.post(url, httpParams, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      map(response => {
        console.log(`[Moodle API] Response for ${function_name}:`, response);
        // Moodle returns exceptions in 200 OK responses
        if (response && (response as any).exception) {
          throw new Error((response as any).message || (response as any).exception);
        }
        return response;
      }),
      catchError((error) => {
        console.error(`[Moodle API] Error (${function_name}):`, error);
        // Improve error message extraction
        const errorMsg = error.error?.message || error.message || 'Error de comunicación con Moodle';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  // --- Messaging ---

  getConversations(userId: number): Observable<MoodleConversation[]> {
    const config = this.configSubject.value;
    if (!config) return of([]);

    return this.callMoodleFunction('core_message_get_conversations', {
      userid: userId,
      limitnum: 50,
      limitfrom: 0,
      type: 1, // Private conversations
      favourites: 0
    }, config).pipe(
      map((response: any) => response.conversations || [])
    );
  }

  getConversationMessages(currentUserId: number, conversationId: number): Observable<MoodleMessage[]> {
    const config = this.configSubject.value;
    if (!config) return of([]);

    return this.callMoodleFunction('core_message_get_conversation_messages', {
      currentuserid: currentUserId,
      convid: conversationId,
      limitnum: 50,
      limitfrom: 0,
      newest: true
    }, config).pipe(
      map((response: any) => (response.messages || []).reverse())
    );
  }

  getUnreadMessagesCount(userId: number): Observable<number> {
    const config = this.configSubject.value;
    if (!config) return of(0);

    return this.callMoodleFunction('core_message_get_unread_conversations_count', {
      useridto: userId
    }, config).pipe(
      map((response: any) => typeof response === 'number' ? response : 0),
      catchError(() => of(0))
    );
  }

  sendMessage(conversationId: number, text: string): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('core_message_send_messages_to_conversation', {
      conversationid: conversationId,
      'messages[0][text]': text,
      'messages[0][textformat]': 1
    }, config);
  }

  // --- Notifications ---

  getNotifications(userId: number): Observable<MoodleNotification[]> {
    const config = this.configSubject.value;
    if (!config) return of([]);

    return this.callMoodleFunction('message_popup_get_popup_notifications', {
      useridto: userId,
      limit: 50,
      offset: 0
    }, config).pipe(
      map((response: any) => response.notifications || [])
    );
  }

  getUnreadNotificationsCount(userId: number): Observable<number> {
    const config = this.configSubject.value;
    if (!config) return of(0);

    return this.callMoodleFunction('message_popup_get_unread_popup_notification_count', {
      useridto: userId
    }, config).pipe(
      map((response: any) => typeof response === 'number' ? response : 0),
      catchError(() => of(0))
    );
  }

  // --- Calendar ---

  getCalendarEvents(start: number, end: number): Observable<MoodleCalendarEvent[]> {
    const config = this.configSubject.value;
    if (!config) return of([]);

    return this.callMoodleFunction('core_calendar_get_calendar_events', {
      'options[timestart]': start,
      'options[timeend]': end,
      'options[userevents]': 1,
      'options[siteevents]': 1
    }, config).pipe(
      map((response: any) => response.events || [])
    );
  }

  // --- Administration ---

  getCategories(): Observable<any[]> {
    const config = this.configSubject.value;
    if (!config) return of([]);
    return this.callMoodleFunction('core_course_get_categories', {}, config);
  }

  createCategory(name: string, parent: number = 0, description: string = ''): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('core_course_create_categories', {
      categories: [{
        name: name,
        parent: parent,
        description: description,
        descriptionformat: 1
      }]
    }, config);
  }

  createCourse(fullname: string, shortname: string, categoryId: number, summary: string = ''): Observable<any> {
    const config = this.configSubject.value;
    if (!config) return throwError(() => new Error('Not configured'));

    return this.callMoodleFunction('core_course_create_courses', {
      courses: [{
        fullname: fullname,
        shortname: shortname,
        categoryid: categoryId,
        summary: summary,
        summaryformat: 1,
        format: 'topics'
      }]
    }, config);
  }

  clearConfig(): void {
    if (this.isBrowser) {
      localStorage.removeItem('moodle_config');
    }
    this.configSubject.next(null);
    this.connectedSubject.next(false);
  }
}
