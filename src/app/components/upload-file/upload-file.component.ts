import { Component, OnInit, OnDestroy } from '@angular/core';
import { FileStorage } from '../../core/models/FileStorage';
import { UploadService } from '../../core/services/upload.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-upload-file',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css']
})
export class UploadFileComponent implements OnInit, OnDestroy {
  fileStorage: FileStorage = {
    UserID: 123,
    ProjectName: '',
    FileName: '',
    InputFileData: null,
    Notes: ''
  };

  isUploading = false;
  isLoading = false;
  pollingSubscription: Subscription | null = null;
  csvData: any[] = [];
  csvHeaders: string[] = [];
  showResults = false;
  selectedFileName = '';
  errorMessage = '';
  successMessage = '';

  constructor(
    private uploadService: UploadService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const savedData = this.uploadService.getFileStorage();
    if (savedData) {
      this.fileStorage = { ...savedData };
      this.selectedFileName = savedData.FileName;
    }

    // Set UserID from auth if available
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.fileStorage.UserID = parseInt(currentUser.id, 10) || 123;
    }
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileStorage.InputFileData = input.files[0];
      this.fileStorage.FileName = input.files[0].name;
      this.selectedFileName = input.files[0].name;
      this.uploadService.setFileStorage(this.fileStorage);
      this.errorMessage = '';
    }
  }

  removeFile() {
    this.fileStorage.InputFileData = null;
    this.fileStorage.FileName = '';
    this.selectedFileName = '';
    this.uploadService.clearFile();
  }

  submitForm() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.fileStorage.InputFileData || !(this.fileStorage.InputFileData instanceof File)) {
      this.errorMessage = 'Please select a valid file';
      return;
    }

    if (!this.fileStorage.ProjectName || this.fileStorage.ProjectName.trim() === '') {
      this.errorMessage = 'Please enter a project name';
      return;
    }

    if (!this.selectedFileName || this.selectedFileName.trim() === '') {
      this.errorMessage = 'Please enter a file name';
      return;
    }

    this.fileStorage.FileName = this.selectedFileName;

    // Show uploading message and disable form
    this.isLoading = true;
    this.successMessage = 'Uploading file, please wait...';
    this.showResults = false;
    this.csvData = [];
    this.csvHeaders = [];

    // Submit file to API
    this.uploadService.submitToInput(
      this.fileStorage,
      'https://hshama7md15.app.n8n.cloud/webhook/upload-file-dxf'
    ).subscribe({
      next: () => {
        // Save data to localStorage before redirecting
        localStorage.setItem('lastFileOutput', JSON.stringify({
          userId: this.fileStorage.UserID,
          projectName: this.fileStorage.ProjectName,
          fileName: this.fileStorage.FileName
        }));
        
        this.successMessage = 'File uploaded successfully! Redirecting...';
        
        // Navigate to file-result after short delay
        setTimeout(() => {
          this.router.navigate(['/file-result']);
        }, 1000);
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.isLoading = false;
        this.errorMessage = 'Failed to upload file. Error: ' + (err?.error?.message || err?.message || 'Unknown error');
      }
    });
  }

  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.submitForm();
  }

  resetForm() {
    this.fileStorage = {
      UserID: this.fileStorage.UserID,
      ProjectName: '',
      FileName: '',
      InputFileData: null,
      Notes: ''
    };
    this.selectedFileName = '';
    this.csvData = [];
    this.csvHeaders = [];
    this.showResults = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadService.clearFile();
  }

  goHome() {
    this.router.navigate(['/']);
  }
}