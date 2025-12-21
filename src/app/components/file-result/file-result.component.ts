import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UploadService } from '../../services/upload.service';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-file-result',
  standalone: true,
imports: [CommonModule, FormsModule],
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

  editing: boolean = false;
  backupData: any[] = [];
  isSaving: boolean = false; // Add loading state for save operation
  isDownloading: boolean = false; // Add loading state for download
  isDarkTheme: boolean = false;

  private pollingSubscription?: Subscription;
  private maxPollingTime = 600000; // 10 دقايق
  private pollingInterval = 3000; // كل 3 ثوان
  private startTime = Date.now();

  currentUserId: number | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private uploadService: UploadService
  ) { }

  // ngOnInit(): void {
  //   const userStr = localStorage.getItem('CURRENT_USER');
  //   if (userStr) {
  //     try {
  //       const u = JSON.parse(userStr);
  //       this.currentUserId = u?.id ? Number(u.id) : null;
  //     } catch { this.currentUserId = null; }
  //   }

  //   // try to load from localStorage first (if coming from history)
  //   const savedDataStr = localStorage.getItem('lastFileOutput');
  //   if (savedDataStr) {
  //     try {
  //       const savedData = JSON.parse(savedDataStr);
        
  //       // check if fileBase64 is already present (from history)
  //       if (savedData.fileBase64) {
  //         this.projectName = savedData.projectName?.toString().trim() || '';
  //         this.fileName = savedData.fileName?.toString().trim() || '';
          
  //         if (!this.projectName) {
  //           this.errorMessage = 'Project name is empty or invalid. Please re-upload the file.';
  //           this.isLoading = false;
  //           return;
  //         }
          
  //         this.done = true;
  //         this.isLoading = true;
  //         this.message = 'Loading file data...';

  //         // process the base64 data directly
  //         this.processBase64ToCsv(savedData.fileBase64);
  //         this.message = 'File loaded successfully!';
  //         this.isLoading = false;
  //       } else {
  //         // no base64, start polling
  //         this.startPolling();
  //       }
  //     } catch (e) {
  //       this.startPolling();
  //     }
  //   } else {
  //     // no data in localStorage, start polling
  //     this.startPolling();
  //   }
  // }

  ngOnInit(): void {
  // Check dark theme preference
  this.isDarkTheme = localStorage.getItem('darkTheme') === 'true';

  const userStr = localStorage.getItem('CURRENT_USER');
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      this.currentUserId = u?.id ? Number(u.id) : null;
    } catch { this.currentUserId = null; }
  }

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
    console.error('Parse error in lastFileOutput:', e);
    // localStorage.removeItem('lastFileOutput'); // تنظيف بيانات تالفة
    this.errorMessage = 'Invalid saved file data. Starting fresh polling...';
    this.startPolling();
    return;
  }

  // تنظيف البيانات
  this.projectName = savedData.projectName?.toString().trim() || '';
  this.fileName = savedData.fileName?.toString().trim() || '';
  const userId = savedData.userId || this.currentUserId;

  if (!this.projectName || !this.fileName) {
    this.errorMessage = 'Project or file name missing.';
    this.isLoading = false;
    return;
  }

  // 1. حالة الـ History: نجيب من السيرفر مباشرة
  if (savedData.fromHistory || this.uploadService.getFileStorage()?.InputFileData === null) {
    this.message = 'Loading file from history...';
    this.isLoading = true;

    this.fetchOutputFile(userId, this.projectName, this.fileName);
    return;
  }

  // 2. حالة فيها base64 محفوظ → نعرض فورًا من الـ cache
  if (savedData.fileBase64) {
    this.message = 'Loading saved file data...';
    this.isLoading = true;
    this.processBase64ToCsv(savedData.fileBase64);
    this.message = 'File loaded successfully!';
    this.done = true;
    this.isLoading = false;
    return;
  }

  // 3. كل الحالات الأخرى: ملف جديد → polling
  this.startPolling();
}
  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  startPolling() {
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

    let { userId, projectName, fileName } = savedData;
    
    // Ensure projectName & fileName are strings and trimmed
    projectName = projectName?.toString().trim() || '';
    fileName = fileName?.toString().trim() || '';

    // التحقق من وجود ProjectName
    if (!projectName || projectName === '') {
      this.errorMessage = 'Project name is invalid or missing. Please upload a file again.';
      this.isLoading = false;
      return;
    }

    if (!fileName || fileName === '') {
      this.errorMessage = 'File name is invalid or missing. Please upload a file again.';
      this.isLoading = false;
      return;
    }

    this.projectName = projectName;
    this.fileName = fileName;

    this.message = 'Waiting for file processing...';

    // بدء الـ Polling: كل 3 ثوان نسأل الـ API
    this.pollingSubscription = interval(this.pollingInterval)
      .pipe(
        takeWhile(() => (Date.now() - this.startTime) < this.maxPollingTime),
        switchMap(() => {
          return this.uploadService.checkOutputStatus(userId, projectName, fileName);
        })
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'Ready') {
            this.done = true;
            this.isLoading = false;
            this.pollingSubscription?.unsubscribe();
            this.fetchOutputFile(userId, projectName, fileName);
          }
          else if (response.status === 'Processing') {
            this.message = 'File is still processing, please wait...';
          }
          else if (response.status === 'NotFound') {
            this.pollingSubscription?.unsubscribe();
            this.errorMessage = 'File record not found. This usually means the file has not been processed yet. Please wait a few moments and refresh the page.';
            this.isLoading = false;
          }
        },
        error: (err) => {
          this.pollingSubscription?.unsubscribe();
      
          if (err.status === 0 || err.status === 408) {
            this.errorMessage = 'Connection timeout. The file is taking longer to process. Please refresh the page and try again.';
          } else {
            this.errorMessage = 'Error checking file status: ' + (err?.error?.message || err?.message || 'Unknown error');
          }
          this.isLoading = false;
        },
        complete: () => {
          if (this.isLoading) {
            this.errorMessage = 'File processing timeout. The server is taking too long to respond. Please try again later.';
            this.isLoading = false;
          }
        }
      });
  }

  fetchOutputFile(userId: number, projectName: string, fileName: string) {
    this.isLoading = true;
    this.message = 'Loading file data...';
    this.errorMessage = '';

    this.uploadService.getOutputFile(userId, projectName, fileName)
      .subscribe({
        next: (res: any) => {
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

      // Ensure last column exists; compute totals and append grand total row
      this.recalculateAllTotals();
      this.appendGrandTotalRow();

    } catch (e) {
      this.errorMessage = "Error decoding CSV file.";
    }
  }

  private recalculateRowTotal(row: any) {
    if (!this.csvHeaders || this.csvHeaders.length < 4) return;

    const colIndex2 = 1; // second column
    const colIndex4 = 3; // fourth column
    const totalIndex = this.csvHeaders.length - 1; // last column

    const h2 = this.csvHeaders[colIndex2];
    const h4 = this.csvHeaders[colIndex4];
    const hTotal = this.csvHeaders[totalIndex];

    const v2 = parseFloat(String(row[h2]).replace(',', '.')) || 0;
    const v4 = parseFloat(String(row[h4]).replace(',', '.')) || 0;
    const total = v2 * v4;

    // Keep as number or formatted string
    row[hTotal] = Number.isFinite(total) ? total.toString() : '0';
  }

  private recalculateAllTotals() {
    // Recalculate totals for all non-total rows
    if (!this.csvHeaders || this.csvHeaders.length < 1) return;
    this.csvData.forEach(r => {
      if (!r.__isTotalRow) this.recalculateRowTotal(r);
    });
  }

  private appendGrandTotalRow() {
    // remove existing grand total row if present
    this.csvData = this.csvData.filter(r => !r.__isTotalRow);

    const totalIndex = this.csvHeaders.length - 1;
    const hTotal = this.csvHeaders[totalIndex];

    let grand = 0;
    this.csvData.forEach(r => {
      const v = parseFloat(String(r[hTotal]).replace(',', '.')) || 0;
      grand += v;
    });

    const totalRow: any = {};
    this.csvHeaders.forEach((h, i) => {
      totalRow[h] = i === 0 ? 'Total' : '';
    });
    totalRow[hTotal] = grand.toString();
    totalRow.__isTotalRow = true;

    this.csvData.push(totalRow);
  }

  enterEditMode() {
    // permission: only manager can edit
    const savedDataStr = localStorage.getItem('lastFileOutput');
    if (!savedDataStr) return alert('No file info available');
    const savedData = JSON.parse(savedDataStr);
    const managerId = savedData.userId;

    if (!this.currentUserId || Number(this.currentUserId) !== Number(managerId)) {
      alert("You don't have permission to edit this file.");
      return;
    }

    // start editing
    this.backupData = JSON.parse(JSON.stringify(this.csvData));
    this.editing = true;
  }

  onCellChange(rowIdx: number, header: string, value: any) {
    if (!this.editing) return;
    const row = this.csvData[rowIdx];
    if (!row || row.__isTotalRow) return;

    row[header] = value;
    // recompute row total and grand total
    this.recalculateRowTotal(row);
    this.appendGrandTotalRow();
  }

  cancelEdit() {
    this.csvData = JSON.parse(JSON.stringify(this.backupData || []));
    this.editing = false;
    // ensure totals
    this.recalculateAllTotals();
    this.appendGrandTotalRow();
  }

  saveEdit() {
    // build csv text from headers and rows excluding grand total row
    const rows = this.csvData.filter(r => !r.__isTotalRow);
    const lines = [this.csvHeaders.join(',')];
    rows.forEach(r => {
      const vals = this.csvHeaders.map(h => {
        const v = r[h] ?? '';
        // escape commas
        return String(v).includes(',') ? `"${String(v).replace(/"/g, '""')}"` : String(v);
      });
      lines.push(vals.join(','));
    });
    const csvText = lines.join('\n');

    const blob = new Blob([csvText], { type: 'text/csv' });

    const savedDataStr = localStorage.getItem('lastFileOutput');
    if (!savedDataStr) return alert('No file info available');
    const savedData = JSON.parse(savedDataStr);

    const managerId = savedData.userId;
    const userId = this.currentUserId || managerId;
    const projectName = this.projectName.trim();
    const fileName = this.fileName.trim();

    // Set loading state to prevent further edits
    this.isSaving = true;

    // Step 1: تحويل CSV لـ Base64 و حفظ في cache
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1]; // extract base64 part

      // Step 2: حفظ البيانات الجديدة في localStorage (cache)
      const updatedCacheData = {
        userId: userId,
        projectName: projectName,
        fileName: fileName,
        fileBase64: base64String
      };

      localStorage.setItem('lastFileOutput', JSON.stringify(updatedCacheData));

      // Step 3: إرسال لـ API
      this.uploadService.saveOutputFile(userId, managerId, projectName, fileName, base64String)
        .subscribe({
          next: (res) => {
            alert('Changes saved successfully! ✅');
            this.isSaving = false;
            this.editing = false;
            
            // Refresh the current page
            location.reload();
          },
          error: (err) => {
            this.isSaving = false;
            alert(`Failed to save changes: ${err.error?.message || err.message || 'Unknown error'}`);
          }
        });
    };

    reader.onerror = () => {
      this.isSaving = false;
      alert('Error processing file. Please try again.');
    };

    reader.readAsDataURL(blob);
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
    this.isDownloading = true;

    this.uploadService.downloadOutputFile(savedData.userId, savedData.projectName, savedData.fileName)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${savedData.fileName}_output.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.isDownloading = false;
        },
        error: (err) => {
          this.isDownloading = false;
          alert('Failed to download output file');
        }
      });
  }

  downloadAllFiles() {
    const savedDataStr = localStorage.getItem('lastFileOutput');
    if (!savedDataStr) return;

    const savedData = JSON.parse(savedDataStr);
    this.isDownloading = true;

    this.uploadService.downloadAllFiles(savedData.userId, savedData.projectName, savedData.fileName)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${savedData.fileName}_all_files.zip`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.isDownloading = false;
        },
        error: (err) => {
          this.isDownloading = false;
          alert('Failed to download Input & Output files.');
        }
      });
  }
}
