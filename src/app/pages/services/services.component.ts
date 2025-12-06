import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Service {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {
  services: Service[] = [
    {
      title: 'Planning & Design',
      description: 'Innovative architectural and structural designs for modern excellence',
      icon: 'M9 3H3v18h18V9h-6V3zm6 12h-2v2h-2v-2h-2v-2h2v-2h2v2h2v2z'
    },
    {
      title: 'Construction Execution',
      description: 'Complete project execution with highest quality standards',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
    },
    {
      title: 'Plumbing & Electrical',
      description: 'Professional installations with 100% safety compliance',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z'
    },
    {
      title: 'Material Procurement',
      description: 'Premium materials with guaranteed quality and best pricing',
      icon: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM8 4v2h8V4H8zm0 6h12V6H8v4zm6-6h2V2h-2v2z'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    // Trigger animation on load
  }

  goToUpload() {
    this.router.navigate(['/upload-data']);
  }
}
