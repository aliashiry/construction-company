import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UploadService } from '../../services/upload.service';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-file-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-result.component.html',
  styleUrls: ['./file-result.component.css']
})
export class FileResultComponent implements OnInit, OnDestroy {
  message: string = 'Processing data...';
  isLoading: boolean = true;
  errorMessage: string = '';
  csvData: any[] = [];
  csvHeaders: string[] = [];
  done : boolean = false;

  private pollingSubscription?: Subscription;
  private maxPollingTime = 600000; // 10 دقايق (600000 مللي ثانية)
  private pollingInterval = 3000; // كل 3 ثوان
  private startTime = Date.now();

  constructor(
    private http: HttpClient,
    private router: Router,
    private uploadService: UploadService
  ) { }

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  startPolling() {
    // ✅ جلب البيانات من localStorage بدلاً من Service
    const savedDataStr = localStorage.getItem('lastFileOutput');

    if (!savedDataStr) {
      this.errorMessage = 'No file data found. Please upload a file first.';
      this.isLoading = false;
      return;
    }

    let savedData: any;
    try {
      savedData = JSON.parse(savedDataStr);
    } catch (e) {
      this.errorMessage = 'Invalid file data. Please upload again.';
      this.isLoading = false;
      return;
    }

    const { userId, projectName, fileName } = savedData;

    // ✅ التحقق من وجود ProjectName
    if (!projectName || projectName.trim() === '') {
      this.errorMessage = 'Project name is missing. Please upload again.';
      this.isLoading = false;
      return;
    }

    console.log('Starting polling with:', { userId, projectName, fileName });
    this.message = 'Waiting for file processing...';

    // بدء الـ Polling: كل 3 ثوان نسأل الـ API
    this.pollingSubscription = interval(this.pollingInterval)
      .pipe(
        takeWhile(() => (Date.now() - this.startTime) < this.maxPollingTime),
        switchMap(() => this.uploadService.checkOutputStatus(userId, projectName, fileName))
      )
      .subscribe({
        next: (response) => {
          console.log('Polling response:', response);

          if (response.status === 'Ready') {
            this.done = true;
            this.isLoading = false;      // ✅ وقف الـ spinner فوراً
            this.pollingSubscription?.unsubscribe(); // وقف الـ polling
            this.fetchOutputFile(userId, projectName, fileName);
          } 
          else if (response.status === 'Processing') {
            this.message = 'File is still processing, please wait...';
          } 
          else if (response.status === 'NotFound') {
            this.pollingSubscription?.unsubscribe();
            this.errorMessage = 'File record not found.';
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Polling error:', err);
          this.pollingSubscription?.unsubscribe();
          this.errorMessage = 'Error checking file status: ' + (err?.error?.message || err?.message || 'Unknown error');
          this.isLoading = false;
        },
        complete: () => {
          if (this.isLoading) {
            this.errorMessage = 'File processing timeout. Please try again later.';
            this.isLoading = false;
          }
        }
      });

  }

  fetchOutputFile(userId: number, projectName: string, fileName: string) {
    this.message = 'Loading file data...';

    this.uploadService.getOutputFile(userId, projectName, fileName)
      .subscribe({
        next: (res) => {
          if (res.FileBase64) {
            this.processBase64ToCsv(res.FileBase64);
            this.message = 'File loaded successfully!';
          } else {
            this.errorMessage = 'No file data in response';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching file:', err);
          this.errorMessage = 'Error fetching file from server';
          this.isLoading = false;
        }
      });
  }

  private processBase64ToCsv(base64String: string) {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const decoder = new TextDecoder('utf-8');
    const csvText = decoder.decode(bytes);

    const lines = csvText.trim().split('\n');
    if (lines.length > 0) {
      this.csvHeaders = lines[0].split(',').map(h => h.trim());
      this.csvData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        this.csvHeaders.forEach((header, index) => row[header] = values[index] || '');
        return row;
      });
    }
  }

  goBack() {
    this.router.navigate(['/upload']);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  getStatus(): 'loading' | 'done' | 'error' {
  if (this.errorMessage) return 'error';
  if (!this.done) return 'loading';
  return 'done';
}

}