import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UploadService } from '../../core/services/upload.service';
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
  projectName: string = '';
  fileName: string = '';

  done: boolean = false;

  private pollingSubscription?: Subscription;
  private maxPollingTime = 600000; // 10 minutes (600000 ms)
  private pollingInterval = 3000; // Every 3 seconds
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
    // ✅ Fetch data from localStorage instead of Service
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
    this.projectName = projectName;
    this.fileName = fileName;

    // ✅ Check for ProjectName existence
    if (!projectName || projectName.trim() === '') {
      this.errorMessage = 'Project name is missing. Please upload again.';
      this.isLoading = false;
      return;
    }

    console.log('Starting polling with:', { userId, projectName, fileName });
    this.message = 'Waiting for file processing...';

    // Start Polling: Ask API every 3 seconds
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
            this.isLoading = false;      // ✅ Stop spinner immediately
            this.pollingSubscription?.unsubscribe(); // Stop polling
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
    this.isLoading = true;
    this.message = 'Loading file data...';
    this.errorMessage = '';

    this.uploadService.getOutputFileBase64(userId, projectName, fileName)
      .subscribe({
        next: (res: any) => {
          console.log("BASE64 RESPONSE:", res);

          if (res?.fileBase64 || res?.FileBase64) {
            const base64 = res.fileBase64 ?? res.FileBase64;

            this.processBase64ToCsv(base64);
            this.message = 'File loaded successfully!';
            this.done = true;
          } else {
            this.errorMessage = 'No file data found in server response.';
          }

          this.isLoading = false;
        },

        error: (err) => {
          console.error('Error fetching file:', err);
          this.errorMessage = 'Error fetching file from server.';
          this.isLoading = false;
        }
      });
  }



  private processBase64ToCsv(base64String: string) {
    try {
      const decoded = atob(base64String);
      const bytes = new Uint8Array(decoded.length);

      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }

      const csvText = new TextDecoder("utf-8").decode(bytes);

      const lines = csvText.trim().split('\n');

      this.csvHeaders = lines[0].split(',').map(h => h.trim());

      this.csvData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        this.csvHeaders.forEach((header, i) => {
          row[header] = values[i] ?? '';
        });
        return row;
      });

    } catch (e) {
      console.error("CSV decode error:", e);
      this.errorMessage = "Error decoding CSV file.";
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


  downloadOutputFile() {
    const savedDataStr = localStorage.getItem('lastFileOutput');
    if (!savedDataStr) return;

    const savedData = JSON.parse(savedDataStr);
    this.uploadService.downloadOutputFile(savedData.userId, savedData.projectName, savedData.fileName)
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${savedData.fileName}_output.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  downloadAllFiles() {
    const savedDataStr = localStorage.getItem('lastFileOutput');
    if (!savedDataStr) return;

    const savedData = JSON.parse(savedDataStr);

    this.uploadService.downloadAllFiles(savedData.userId, savedData.projectName, savedData.fileName)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${savedData.fileName}_all_files.zip`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Download all files error:', err);
          alert('Failed to download Input & Output files.');
        }
      });
  }



}