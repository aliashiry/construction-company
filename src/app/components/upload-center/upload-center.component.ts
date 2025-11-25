import { Component, Output, EventEmitter, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-upload-center',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './upload-center.component.html',
  styleUrl: './upload-center.component.scss'
})
export class UploadCenterComponent {
  @Input() isDarkTheme = true;
  @Output() fileSelected = new EventEmitter<File>();
  isDragging = false;
  showAuthModal = false;
  uploadedFile: File | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  triggerFileInput(fileInput: HTMLInputElement) {
    if (this.authService.isLoggedIn()) {
      fileInput.click();
    } else {
      this.showAuthModal = true;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadedFile = input.files[0];
      this.fileSelected.emit(input.files[0]);
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (!this.authService.isLoggedIn()) {
      this.showAuthModal = true;
      return;
    }
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadedFile = event.dataTransfer.files[0];
      this.fileSelected.emit(event.dataTransfer.files[0]);
    }
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
}

