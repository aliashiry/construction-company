import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject, lastValueFrom } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { UploadCenterComponent } from './components/upload-center/upload-center.component';
import { AuthService } from './services/auth.service';
import { UploadService} from './services/upload.service';
import { User } from './interfaces/user.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, UploadCenterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Premium Construction & Engineering';
  menuOpen = false;
  isDarkTheme = false;
  isStandalonePage = false;
  currentUser: User | null = null;
  isLoggedIn = false;
  activeTab: string = 'home';
  showAuthModal: boolean = false;


  // استخدام BehaviorSubject مع null كقيمة افتراضية
  projectCountSubject = new BehaviorSubject<number | null>(null);
  totalFilesCountSubject = new BehaviorSubject<number | null>(null);

  // Observable للـ HTML
  projectCount$ = this.projectCountSubject.asObservable();
  totalFilesCount$ = this.totalFilesCountSubject.asObservable();

  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router, 
    private authService: AuthService, 
    private uploadService: UploadService
  ) {
    let initPath = this.router.url || location.pathname || '';
    initPath = initPath.split('#').pop() || initPath;
    initPath = initPath.split('?')[0];
    this.isStandalonePage = /^\/?(login|register|profile|upload|file-result|history|error|workon)(\/|$)/i.test(initPath);
    this.updateActiveTab(initPath);
  }

  ngOnInit() {
    document.documentElement.style.scrollBehavior = 'smooth';
    this.applyTheme();

    // Subscribe to authentication state
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;

      if (this.isLoggedIn) {
        this.refreshStats();
        // refreshStats
      } else {
        this.projectCountSubject.next(null);
        this.totalFilesCountSubject.next(null);
      }
    });

    // Track route changes
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        let path = event.urlAfterRedirects || event.url;
        if (!path) path = location.pathname || '';
        path = path.split('#').pop() || path;
        path = path.split('?')[0];
        const standalone = /^\/?(login|register|profile|upload|file-result|history|error|workon)(\/|$)/i.test(path);
        this.isStandalonePage = standalone;
        this.updateActiveTab(path);
      }
    });

    // Initialize stats for page load
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

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyTheme() {
    const body = document.body;
    if (this.isDarkTheme) {
      body.style.backgroundColor = '#0f172a';
      body.style.color = '#ffffff';
    } else {
      body.style.backgroundColor = '#f8fafc';
      body.style.color = '#0f172a';
    }
  }

  onFileSelected(file: File) {
    // console.log('File selected:', file.name);
    // بعد رفع الملف بنجاح، حدث الـ stats
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
// Load stats and update subjects
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
    // تحويل الـ Observable لـ Promise باستخدام lastValueFrom
    const projectCount = await lastValueFrom(this.uploadService.getFilesCountByProject(userId, 'defaultProject'));
    const filesCount = await lastValueFrom(this.uploadService.getFilesCount(userId));

    this.projectCountSubject.next(projectCount ?? 0);
    this.totalFilesCountSubject.next(filesCount ?? 0);
  } catch (err) {
    console.error('Error fetching user stats:', err);
    this.projectCountSubject.next(0);
    this.totalFilesCountSubject.next(0);
  }
}

refreshStats() {
  this.loadUserStats().then(() => {
    // console.log('Project count:', this.projectCountSubject.value);
    // console.log('Total files count:', this.totalFilesCountSubject.value);
  });
}}