import { Component, OnInit, OnDestroy } from '@angular/core';
import { FileStorage } from '../../interfaces/FileStorage';
import { UploadService } from '../../services/upload.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoadingComponent } from '../loading/loading.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-upload-file',
  standalone: true,
  imports: [FormsModule, CommonModule, LoadingComponent],
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

    if (!this.fileStorage.InputFileData) {
  this.errorMessage = 'يرجى اختيار ملف';
return;
    }

    if (!this.fileStorage.ProjectName || this.fileStorage.ProjectName.trim() === '') {
this.errorMessage = 'يرجى إدخال اسم المشروع';
      return;
    }

    if (!this.selectedFileName || this.selectedFileName.trim() === '') {
      this.errorMessage = 'يرجى إدخال اسم الملف';
 return;
    }

    // Update filename in fileStorage
    this.fileStorage.FileName = this.selectedFileName;

    this.isLoading = true;
    this.showResults = false;
    this.csvData = [];
    this.csvHeaders = [];

    // Submit to API
    this.uploadService.submitToInput(this.fileStorage).subscribe({
next: () => {
        this.successMessage = 'تم إرسال البيانات بنجاح، جاري معالجة الملف...';
     // Start polling after successful submission
   this.startPolling();
      },
      error: (err) => {
      console.error('Upload failed', err);
        this.isLoading = false;
        this.errorMessage = 'فشل في إرسال البيانات. تفاصيل الخطأ: ' + (err?.error?.message || err?.message || 'خطأ غير معروف');
      }
    });
  }

  private startPolling() {
    let pollCount = 0;
    const maxPolls = 120; // 20 minutes with 10-second intervals

    this.pollingSubscription = interval(10000).subscribe(() => {
      pollCount++;

      if (pollCount > maxPolls) {
        this.stopPolling();
 this.isLoading = false;
      this.errorMessage = 'انتهت مهلة المعالجة (20 دقيقة)';
    return;
      }

      this.uploadService.checkOutput(
      this.fileStorage.UserID,
        this.fileStorage.ProjectName,
   this.selectedFileName
      ).subscribe({
   next: (response) => {
      const isReady = response === true || response.status === 200 || response.isReady === true;
          if (isReady) {
          this.fetchOutputFile();
    }
        },
 error: (err) => {
       console.log('Still processing...', err);
        }
      });
    });
  }

  private fetchOutputFile() {
    this.uploadService.getOutputFile(
      this.fileStorage.UserID,
      this.fileStorage.ProjectName,
      this.selectedFileName
    ).subscribe({
      next: (response) => {
        if (response && response.base64) {
      this.processBase64ToCsv(response.base64);
     this.stopPolling();
     } else {
          this.errorMessage = 'لم يتم الحصول على النتائج';
   this.isLoading = false;
          this.stopPolling();
        }
      },
      error: (err) => {
        console.error('Error fetching output file', err);
        this.errorMessage = 'خطأ في جلب الملف: ' + (err?.error?.message || err?.message || 'خطأ غير معروف');
        this.isLoading = false;
        this.stopPolling();
      }
    });
  }

  private processBase64ToCsv(base64String: string) {
    try {
      // Decode base64
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

    // Convert to text
      const decoder = new TextDecoder('utf-8');
      const csvText = decoder.decode(bytes);

 // Parse CSV
    const lines = csvText.trim().split('\n');
      if (lines.length > 0) {
        this.csvHeaders = lines[0].split(',').map(h => h.trim());
        this.csvData = [];

      for (let i = 1; i < lines.length; i++) {
const values = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          this.csvHeaders.forEach((header, index) => {
            row[header] = values[index] || '';
 });
   this.csvData.push(row);
        }
      }

  this.isLoading = false;
      this.showResults = true;
      this.successMessage = 'تم معالجة الملف بنجاح!';
    } catch (error) {
   console.error('Error processing CSV', error);
      this.isLoading = false;
      this.errorMessage = 'خطأ في معالجة الملف: ' + (error instanceof Error ? error.message : 'خطأ غير معروف');
    }
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
