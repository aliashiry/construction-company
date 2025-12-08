import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadService } from '../../services/upload.service';
import { FileStorage } from '../../interfaces/FileStorage'; 

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  fileHistory: FileStorage[] = []; 
  isLoading: boolean = true;
  errorMessage: string = '';
  userId: number = 0;

  constructor(private uploadService: UploadService) {}

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

  downloadInputFile(projectName: string, fileName: string): void {
    this.uploadService.downloadAllFiles(this.userId, projectName, fileName).subscribe({
      next: (blob) => {
        this.saveFile(blob, fileName);
      },
      error: (error) => {
        console.error('❌ Error downloading input file:', error);
        alert('Failed to download input file');
      }
    });
  }

  downloadOutputFile(projectName: string, fileName: string): void {
    this.uploadService.downloadOutputFile(this.userId, projectName, fileName).subscribe({
      next: (blob) => {
        this.saveFile(blob, `output_${fileName}`);
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

  formatDate(date: Date | string): string {
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