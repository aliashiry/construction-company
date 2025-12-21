import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Subject, BehaviorSubject, lastValueFrom } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { UploadCenterComponent } from './components/upload-center/upload-center.component';
import { AuthService } from './services/auth.service';
import { UploadService } from './services/upload.service';
import { User } from './interfaces/user.interface';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, UploadCenterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Premium Construction & Engineering';
  menuOpen = false;
  isStandalonePage = false;
  currentUser: User | null = null;
  isLoggedIn = false;
  activeTab: string = 'home';
  showAuthModal: boolean = false;

  projectCountSubject = new BehaviorSubject<number | null>(null);
  totalFilesCountSubject = new BehaviorSubject<number | null>(null);

  projectCount$ = this.projectCountSubject.asObservable();
  totalFilesCount$ = this.totalFilesCountSubject.asObservable();

  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private uploadService: UploadService,
    public themeService: ThemeService
  ) {
    let initPath = this.router.url || location.pathname || '';
    initPath = initPath.split('#').pop() || initPath;
    initPath = initPath.split('?')[0];
    this.isStandalonePage =
      /^\/?(login|register|profile|upload|file-result|history|error|workon)(\/|$)/i.test(
        initPath
      );
    this.updateActiveTab(initPath);
  }

  ngOnInit() {
    document.documentElement.style.scrollBehavior = 'smooth';

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        this.isLoggedIn = !!user;

        if (this.isLoggedIn) {
          this.refreshStats();
        } else {
          this.projectCountSubject.next(null);
          this.totalFilesCountSubject.next(null);
        }
      });

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        let path = event.urlAfterRedirects || event.url;
        if (!path) path = location.pathname || '';
        path = path.split('#').pop() || path;
        path = path.split('?')[0];
        const standalone =
          /^\/?(login|register|profile|upload|file-result|history|error|workon)(\/|$)/i.test(
            path
          );
        this.isStandalonePage = standalone;
        this.updateActiveTab(path);
      }
    });

    const userStr = localStorage.getItem('CURRENT_USER');
    if (userStr) {
      this.loadUserStats();
    }
  }

  updateActiveTab(path: string) {
    if (path === '/' || path === '') {
      this.activeTab = 'home';
    } else if (path.includes('services')) {
      this.activeTab = 'services';
    } else if (path.includes('contact')) {
      this.activeTab = 'contact';
    } else {
      this.activeTab = '';
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(file: File) {
    this.loadUserStats();
  }

  openForm() {
    const user = localStorage.getItem('CURRENT_USER');
    if (!user) {
      this.showAuthModal = true;
      return;
    }
    this.showAuthModal = false;
    this.router.navigate(['/upload']);
  }

  closeModal() {
    this.showAuthModal = false;
  }

  goToLogin() {
    this.showAuthModal = false;
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.showAuthModal = false;
    this.router.navigate(['/register']);
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return 'U';
    const names = this.currentUser.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.currentUser.name[0].toUpperCase();
  }
  async loadUserStats() {
    const userStr = localStorage.getItem('CURRENT_USER');
    if (!userStr) {
      console.error('No user logged in.');
      this.projectCountSubject.next(0);
      this.totalFilesCountSubject.next(0);
      return;
    }

    const user = JSON.parse(userStr);
    const userId = user.id;

    try {
      const projectCount = await lastValueFrom(
        this.uploadService.getFilesCountByProject(userId, 'defaultProject')
      );
      const filesCount = await lastValueFrom(
        this.uploadService.getFilesCount(userId)
      );

      this.projectCountSubject.next(projectCount ?? 0);
      this.totalFilesCountSubject.next(filesCount ?? 0);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      this.projectCountSubject.next(0);
      this.totalFilesCountSubject.next(0);
    }
  }

  refreshStats() {
    this.loadUserStats().then(() => {});
  }
}