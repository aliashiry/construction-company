import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { UploadCenterComponent } from './components/upload-center/upload-center.component';
import { ListModeComponent } from "./components/list-mode/list-mode.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, UploadCenterComponent, ListModeComponent],
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

  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    this.applyTheme();
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
        const standalone = /^\/?(login|register)(\/|$)/i.test(path);
        this.isStandalonePage = standalone;
      }
    });
  }

  constructor(private router: Router) {
    // Initialize state for direct loads
    let initPath = this.router.url || location.pathname || '';
    initPath = initPath.split('#').pop() || initPath;
    initPath = initPath.split('?')[0];
    this.isStandalonePage = /^\/?(login|register)(\/|$)/i.test(initPath);
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
}
