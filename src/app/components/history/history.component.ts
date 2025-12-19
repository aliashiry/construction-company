import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UploadService } from '../../services/upload.service';
import { FileDataFromAPI } from '../../interfaces/FileStorage';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  fileHistory: FileDataFromAPI[] = [];  
  isLoading: boolean = true;
  errorMessage: string = '';
  userId: number = 0;
  loadingFileId: string = ''; // track which file is being loaded

  constructor(
    private uploadService: UploadService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserHistory();
  }

  loadUserHistory(): void {
    const userStr = localStorage.getItem('CURRENT_USER');
    if (!userStr) {
      this.errorMessage = 'Please login to view history';
      this.isLoading = false;
      return;
    }

    const user = JSON.parse(userStr);
    this.userId = user.id;

    this.uploadService.getFullFileData(this.userId).subscribe({
      next: (response) => {
        this.fileHistory = response.fullFileData || [];
        this.isLoading = false;
        console.log('✅ File History Loaded:', this.fileHistory);
      },
      error: (error) => {
        console.error('❌ Error loading history:', error);
        this.errorMessage = 'Failed to load file history';
        this.isLoading = false;
      }
    });
  }

  /**
   * تحميل الملف والتنقل لـ file-result
   * يستخدم الـ API بتاعت getOutputFileBase64 من upload.service
   */
  viewFileResult(projectName: string, fileName: string): void {
    // Validate inputs
    if (!projectName || projectName.trim() === '') {
      alert('❌ Project name is empty. Please check the data and try again.');
return;
    }

    if (!fileName || fileName.trim() === '') {
   alert('❌ File name is empty. Please check the data and try again.');
      return;
    }

    const fileId = `${projectName}_${fileName}`;
    this.loadingFileId = fileId;

    // Clean data
    const cleanProjectName = projectName.trim();
    const cleanFileName = fileName.trim();

    console.log('📥 Loading file from history:', { 
      userId: this.userId, 
      projectName: cleanProjectName, 
      fileName: cleanFileName,
      projectNameType: typeof cleanProjectName,
      fileNameType: typeof cleanFileName 
  });

  // Check if file exists locally first
    const savedDataStr = localStorage.getItem('lastFileOutput');
    if (savedDataStr) {
      try {
        const cachedData = JSON.parse(savedDataStr);
        if (cachedData.fileBase64) {
 // Use cached data if it matches
          console.log('✅ Using cached file data');
          this.router.navigate(['/file-result']);
          return;
     }
      } catch (e) { }
    }

    // استخدام الـ API الموجودة بتاعت getOutputFileBase64
    this.uploadService.getOutputFileBase64(this.userId, cleanProjectName, cleanFileName).subscribe({
      next: (response: any) => {
        console.log('📦 API Response:', response);
 
        // تحقق من البيانات بأشكال مختلفة
   const base64 = response?.fileBase64 || response?.FileBase64 || response?.base64;

  if (base64 && base64.trim().length > 0) {
          // تخزين البيانات كاملة في localStorage لصفحة file-result
      const dataToStore = {
            userId: this.userId,
            projectName: cleanProjectName,
         fileName: cleanFileName,
            fileBase64: base64
          };

          console.log('💾 Storing to localStorage:', {
            userId: dataToStore.userId,
   projectName: dataToStore.projectName,
       fileName: dataToStore.fileName,
            base64Length: dataToStore.fileBase64.length
          });

          localStorage.setItem('lastFileOutput', JSON.stringify(dataToStore));

          console.log('✅ File data saved to localStorage');

          // التنقل فوراً لصفحة file-result
          this.router.navigate(['/file-result']);
 } else {
          console.error('❌ No base64 data in response:', response);
        alert('⚠️ File Processing Error\n\n' +
         'The output file for this input has not been generated yet.\n\n' +
            'This usually happens because:\n' +
            '• The file is still being processed\n' +
            '• The processing failed\n' +
  '• The output file was not created\n\n' +
        'Please re-upload the input file and wait for it to be processed.\n' +
            'Processing typically takes a few minutes.');
       this.loadingFileId = '';
  }
      },
      error: (error) => {
  console.error('❌ Error loading file:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
      console.error('Error details:', error.error);
        console.error('Error URL:', error.url);
    console.error('ProjectName sent to API:', cleanProjectName);

        if (error.status === 404) {
          alert('⚠️ File Not Found\n\n' +
            'The output file for this record does not exist.\n\n' +
       'Possible reasons:\n' +
 '• The file has not been processed yet\n' +
   '• The processing encountered an error\n' +
            '• The output file was not created properly\n\n' +
    'Solution:\n' +
            'Please re-upload the input file using the upload section.\n' +
            'Make sure to wait for the processing to complete.\n\n' +
        'Details:\n' +
         `Project: ${cleanProjectName}\n` +
            `File: ${cleanFileName}`);
        } else if (error.status === 400) {
          alert('❌ Invalid Request\n\n' +
            'The request parameters are invalid.\n\n' +
     'Please verify:\n' +
     '• Project name is correct: "' + cleanProjectName + '"\n' +
            '• File name is correct: "' + cleanFileName + '"\n' +
         '• User ID is valid\n\n' +
     'If the problem persists, please re-upload the file.');
        } else if (error.status === 500) {
       alert('❌ Server Error\n\n' +
  'An error occurred on the server.\n\n' +
            'Please try again later or contact support if the problem persists.');
        } else if (error.status === 0) {
          alert('❌ Connection Error\n\n' +
  'Could not connect to the server.\n\n' +
   'Please check:\n' +
   '• Your internet connection\n' +
            '• The server is running\n' +
            '• Try refreshing the page\n\n' +
       'Details:\n' +
 `Project: ${cleanProjectName}\n` +
            `File: ${cleanFileName}`);
        } else {
   alert('❌ Failed to Load File\n\n' +
        `Error: ${error.error?.message || error.message || 'Unknown error'}\n` +
`Status: ${error.status}\n\n` +
      'Please try again or re-upload the input file.');
        }

   this.loadingFileId = '';
      }
    });
  }

  downloadAllFiles(projectName: string, fileName: string): void {
    this.uploadService.downloadAllFiles(this.userId, projectName, fileName).subscribe({
      next: (blob) => {
        const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        this.saveFile(blob, `Project-${projectName}_${fileNameWithoutExt}.zip`);
      },
      error: (error) => {
        console.error('Error downloading input file:', error);
        alert('Failed to download input file');
      }
    });
  }

  downloadOutputFile(projectName: string, fileName: string): void {
    this.uploadService.downloadOutputFile(this.userId, projectName, fileName).subscribe({
      next: (blob) => {
        const fileNameWithoutExt = fileName.replace(/\.(dxf|DXF|dwg|DWG)$/i, '');
        this.saveFile(blob, `${fileNameWithoutExt}_output.csv`);
      },
      error: (error) => {
        console.error('❌ Error downloading output file:', error);
        alert('Failed to download output file');
      }
    });
  }

  private saveFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  refreshHistory(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.loadUserHistory();
  }
}
