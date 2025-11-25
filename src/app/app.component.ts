import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { UploadCenterComponent } from './components/upload-center/upload-center.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, UploadCenterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Premium Construction & Engineering';
  menuOpen = false;
  // Default theme: light
  isDarkTheme = false;
  // Hide navbar/footer for standalone pages (login/register)
  isStandalonePage = false;

  ngOnInit() {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    this.applyTheme();
    // Track route changes and determine whether current route is a standalone page
    // (login or register) so we can hide navbar/footer
    // Router may not be available during SSR compile; guard with optional chaining.
    if ((this as any).router instanceof Router || (this as any).router) {
      // handled in constructor now
    }
  }

  constructor(private router: Router) {
    // On route changes, set isStandalonePage to true when navigating to /login or /register
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        let path = event.urlAfterRedirects || event.url;
        if (!path) path = location.pathname || '';
        // Remove hash and query params
        path = path.split('#').pop() || path;
        path = path.split('?')[0];
        // Match /login, /login/, /register, /register/ etc.
        const standalone = /^\/?(login|register)(\/|$)/i.test(path);
        this.isStandalonePage = standalone;
      }
    });

    // Initialize state (for direct loads)
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
