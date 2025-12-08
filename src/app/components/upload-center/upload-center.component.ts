import { Component, Output, EventEmitter, HostListener, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-upload-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-center.component.html',
  styleUrls: ['./upload-center.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadCenterComponent {
  @Input() isDarkTheme = true;
  @Output() fileSelected = new EventEmitter<File>();
  isDragging = false;
  showAuthModal = false;
  uploadedFile: File | null = null;

  constructor(private authService: AuthService,
    private router: Router,
    private uploadService: UploadService
  ) { }

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

      // Store file in UploadService
      this.uploadService.setFileStorage({
        UserID: 123, // from auth for login user
        ProjectName: '',
        FileName: input.files[0].name,
        InputFileData: input.files[0],
        Notes: ''
        // dateCreate?: new Date()
      });

      this.fileSelected.emit(input.files[0]);
    }
  }


  // For remove item form upload section
  removeFile() {
    this.uploadedFile = null;
    this.uploadService.clearFile();
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

      this.uploadService.setFileStorage({
        UserID: 123,
        ProjectName: '',
        FileName: event.dataTransfer.files[0].name,
        InputFileData: event.dataTransfer.files[0],
        Notes: ''
      });

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

