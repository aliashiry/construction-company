import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  isDarkTheme = signal(false);

  constructor() {
    // Load theme preference from localStorage on initialization
    const savedTheme = localStorage.getItem('darkTheme');
    if (savedTheme !== null) {
      this.isDarkTheme.set(savedTheme === 'true');
    }
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkTheme.set(!this.isDarkTheme());
    localStorage.setItem('darkTheme', this.isDarkTheme().toString());
    this.applyTheme();
  }

  private applyTheme() {
    const body = document.body;
    const rootDiv = document.querySelector('.min-h-screen') as HTMLElement;

    if (this.isDarkTheme()) {
      body.style.backgroundColor = '#0f172a';
      body.style.color = '#ffffff';
      if (rootDiv) {
        rootDiv.classList.remove('light-mode');
        rootDiv.classList.add('dark-mode');
      }
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
    } else {
      body.style.backgroundColor = '#f8fafc';
      body.style.color = '#0f172a';
      if (rootDiv) {
        rootDiv.classList.remove('dark-mode');
        rootDiv.classList.add('light-mode');
      }
      body.classList.remove('dark-mode');
      body.classList.add('light-mode');
    }
  }
}
