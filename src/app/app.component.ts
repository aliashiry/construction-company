import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Premium Construction & Engineering';
  menuOpen = false;

  ngOnInit() {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
