import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { UploadCenterComponent } from './components/upload-center/upload-center.component';
import { ListModeComponent } from "./components/list-mode/list-mode.component";
import { AuthService } from './services/auth.service';
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
  // Default theme: light
  isDarkTheme = false;
  // Hide navbar/footer for standalone pages (login/register)
  isStandalonePage = false;
  // Authentication state
  currentUser: User | null = null;
  isLoggedIn = false;
  // Active tab tracking
  activeTab: string = 'home';

  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    this.applyTheme();
    
    // Subscribe to authentication state
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });
    
    // Track route changes and determine whether current route is a standalone page
    // (login or register) so we can hide navbar/footer
    // Subscriptions handled here and cleaned up in OnDestroy.
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        let path = event.urlAfterRedirects || event.url;
        if (!path) path = location.pathname || '';
        // Remove hash and query params
        path = path.split('#').pop() || path;
        path = path.split('?')[0];
        const standalone = /^\/?(login|register|profile|upload-data)(\/|$)/i.test(path);
        this.isStandalonePage = standalone;
        
        // Update active tab based on route
        this.updateActiveTab(path);
      }
    });
  }

  constructor(private router: Router, private authService: AuthService) {
    // Initialize state for direct loads
    let initPath = this.router.url || location.pathname || '';
    initPath = initPath.split('#').pop() || initPath;
    initPath = initPath.split('?')[0];
    this.isStandalonePage = /^\/?(login|register|profile|upload-data)(\/|$)/i.test(initPath);
    this.updateActiveTab(initPath);
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
    console.log('File selected:', file.name);
  }


  openForm(){
    this.router.navigate(['/upload-data']);
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
}
