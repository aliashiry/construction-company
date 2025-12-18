import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Observable, catchError, map, startWith, shareReplay, forkJoin } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { UploadService } from '../../services/upload.service';
import { User } from '../../interfaces/user.interface';
import { FileDataFromAPI } from '../../interfaces/FileStorage';
import { Location } from '@angular/common';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  timestamp: Date;
}

interface ProjectItem {
  name: string;
  filesCount: number;
  progressPercent: number;
  lastUpdated: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  // ================= User =================
  currentUser: User | null = null;
  currentUserId: number | null = null;

  // ================= UI =================
  isDarkTheme = false;

  // ================= Statistics =================
  projectCount$!: Observable<number>;
  totalFilesCount$!: Observable<number>;
  completedTasks$!: Observable<number>;
  recentActivity$!: Observable<ActivityItem[]>;
  recentProjects$!: Observable<ProjectItem[]>;

  // ================= Private Subjects =================
  private projectCountSubject = new BehaviorSubject<number>(0);
  private totalFilesCountSubject = new BehaviorSubject<number>(0);
  private completedTasksSubject = new BehaviorSubject<number>(0);
  private activitySubject = new BehaviorSubject<ActivityItem[]>([]);
  private projectsSubject = new BehaviorSubject<ProjectItem[]>([]);

  // ================= Lifecycle =================
  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private uploadService: UploadService,
    private location: Location
  ) { }

  // ================= Init =================
  ngOnInit(): void {
    // Initialize observables
    this.projectCount$ = this.projectCountSubject.asObservable();
    this.totalFilesCount$ = this.totalFilesCountSubject.asObservable();
    this.completedTasks$ = this.completedTasksSubject.asObservable();
    this.recentActivity$ = this.activitySubject.asObservable();
    this.recentProjects$ = this.projectsSubject.asObservable();

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        if (!user) {
          this.router.navigate(['/login']);
          return;
        }

        this.currentUserId = parseInt(user.id, 10);
        this.loadUserData();
      });

    this.isDarkTheme = localStorage.getItem('darkTheme') === 'true';

    if (this.isDarkTheme) {
      document.body.classList.add('dark-mode');
    }
  }

  // ================= Destroy =================
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.classList.remove('dark-mode');
  }

  // ================= Helpers =================
  getUserInitials(): string {
    if (!this.currentUser?.name) return 'U';

    const names = this.currentUser.name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }

    return this.currentUser.name[0].toUpperCase();
  }

  private getRelativeTime(date: Date | string): string {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    return targetDate.toLocaleDateString();
  }

  // ================= Data =================
  private loadUserData(): void {
    if (!this.currentUserId) return;

    this.loadProjectCount();
    this.loadFilesCount();
    this.loadActivity();
    this.loadProjects();
  }

  private loadProjectCount(): void {
    if (!this.currentUserId) return;

    this.uploadService.getProjectsCount(this.currentUserId)
      .pipe(
        map(res => res.ProjectCount ?? 0),
        catchError(err => {
          console.error('Error loading project count:', err);
          return [0];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(count => this.projectCountSubject.next(count));
  }

  private loadFilesCount(): void {
    if (!this.currentUserId) return;

    this.uploadService.getFilesCount(this.currentUserId)
      .pipe(
        map(count => count ?? 0),
        catchError(err => {
          console.error('Error loading files count:', err);
          return [0];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(count => this.totalFilesCountSubject.next(count));
  }

  private loadActivity(): void {
    if (!this.currentUserId) return;

    this.uploadService.getFullFileData(this.currentUserId)
      .pipe(
        map(response => {
          const activities: ActivityItem[] = [];
          const files = response.fullFileData || [];

          if (files.length > 0) {
            files.slice(0, 4).forEach((file: FileDataFromAPI, index: number) => {
              const timestamp = file.dateCreate ? new Date(file.dateCreate) : new Date();
              const timeAgo = this.getRelativeTime(timestamp);

              activities.push({
                id: `activity-${index}`,
                title: `File uploaded: ${file.fileName}`,
                description: `Project: ${file.projectName}`,
                timeAgo,
                timestamp
              });
            });
          }

          this.completedTasksSubject.next(files.length > 0 ? Math.min(files.length * 3, 100) : 0);
          return activities;
        }),
        catchError(err => {
          console.error('Error loading activity:', err);
          return [[]];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(activities => this.activitySubject.next(activities));
  }

  private loadProjects(): void {
    if (!this.currentUserId) return;

    this.uploadService.getAllProjects(this.currentUserId)
      .pipe(
        takeUntil(this.destroy$),
        map((projectNames: string[]) => projectNames || []),
        // استخدام mergeMap أو forkJoin لجلب الملفات لكل مشروع
        map(projectNames => {
          const projectObservables = projectNames.map(projectName =>
            this.uploadService.getFullFileData2(this.currentUserId!, projectName)
              .pipe(
                map(response => {
                  // console.log(`📁 Project: ${projectName}`, response);
                  // Handle both array response and object with fullFileData property
                  const files = Array.isArray(response) ? response : (response?.fullFileData || []);
                  // console.log(`📄 Files count for ${projectName}:`, files.length);
                  // console.log(`📄 Files data:`, files);
                  
                  const lastUpdated = files.length && files[0].dateCreate
                    ? this.getRelativeTime(new Date(files[0].dateCreate))
                    : 'N/A';

                  return {
                    name: projectName,
                    filesCount: files.length,
                    progressPercent: Math.min(files.length * 5, 100), // تقدير بسيط
                    lastUpdated
                  } as ProjectItem;
                }),
                catchError(err => {
                  console.error(`Error loading files for project ${projectName}:`, err);
                  return [{ name: projectName, filesCount: 0, progressPercent: 0, lastUpdated: 'N/A' }];
                })
              )
          );

          return projectObservables;
        }),
        // تنفيذ كل الاستدعاءات بشكل متوازي
        switchMap(projectObservables => forkJoin(projectObservables))
      )
      .subscribe(projects => this.projectsSubject.next(projects));
  }


  // private loadProjects(): void {
  //   if (!this.currentUserId) return;

  //   this.uploadService.getAllProjects(this.currentUserId)
  //     .pipe(
  //       map((projectNames: string[]) => {
  //         const projects: ProjectItem[] = [];
  //         projectNames.slice(0, 3).forEach((projectName: string, index: number) => {
  //           projects.push({
  //             name: projectName,
  //             filesCount: Math.floor(Math.random() * 15) + 1,
  //             progressPercent: Math.floor(Math.random() * 50) + 40,
  //             lastUpdated: this.getRelativeTime(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000))
  //           });
  //         });

  //         return projects;
  //       }),
  //       catchError(err => {
  //         console.error('Error loading projects:', err);
  //         return [[]];
  //       }),
  //       takeUntil(this.destroy$)
  //     )
  //     .subscribe(projects => this.projectsSubject.next(projects));
  // }

  // ================= Navigation =================
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  navigateToBack(): void {
    this.location.back();
  }

  // ================= Theme =================
  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('darkTheme', this.isDarkTheme.toString());

    if (this.isDarkTheme) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  handleLogout(): void {
    // استدعاء دالة logout من UploadService
    this.authService.logout();

    // التوجيه لصفحة تسجيل الدخول
    this.router.navigate(['/login']);
  }
}
