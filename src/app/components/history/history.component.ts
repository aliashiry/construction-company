import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WorkOnService } from '../../services/work-on.service';
import { UploadService } from '../../services/upload.service';
import { FileDataFromAPI, FileStorage } from '../../interfaces/FileStorage';
import { ProjectData } from '../../interfaces/FileStorage';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule , RouterModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit, OnDestroy {
  /**
   * Loading state for data fetching
   * Used in HTML: *ngIf="loading"
   */
  loading = true;

  /**
   * Error message if API calls fail
   * Used in HTML: {{ error }}
   */
  error: string | null = null;

  /**
   * Dark theme toggle state
   * Used in HTML: [class.dark-mode]="isDarkTheme"
   */
  isDarkTheme = false;

  /**
   * Active tab selection
   * Used in HTML: [class.active]="activeTab === 'projects'"
   */
   activeTab: 'projects' | 'files' | 'view-all' = 'projects';


  /**
   * Projects data array (grouped by ProjectName)
   * Used in HTML: *ngFor="let project of projects"
   */
  projects: ProjectData[] = [];

  /**
   * Files data array from API (HISTORY ONLY - NOT WORKON)
   * Used in HTML: *ngFor="let file of files"
   */
  files: FileDataFromAPI[] = [];

  /**
   * Statistics counters
   * Used in HTML: {{ projectsCount }}, {{ totalFilesCount }}
   */
  projectsCount = 0;
  totalFilesCount = 0;

  /**
   * Open menu ID for dropdown
   * Used in HTML: *ngIf="openMenuId === project.projectName"
   */
  openMenuId: string | null = null;

  /**
   * Subject for cleanup subscriptions
   */
  private destroy$ = new Subject<void>();

  /**
   * Current user ID from localStorage
   */
  private currentUserID: number = 0;

  /**
   * Current user full name
   */
  private currentUserName: string = '';

  constructor(
    private router: Router,
    private workOnService: WorkOnService,
    private uploadService: UploadService
  ) {}

  ngOnInit() {
    // Get current user from localStorage
    const userStr = localStorage.getItem('CURRENT_USER');
    if (!userStr) {
      this.router.navigate(['/login']);
      return;
    }

    const user = JSON.parse(userStr);
    this.currentUserID = user.id; // UserID from database
    this.currentUserName = user.name || user.fullName || 'User';

    // Check dark theme preference
    this.isDarkTheme = localStorage.getItem('darkTheme') === 'true';

    // Load all data
    this.loadAllData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all data (projects, files from history only)
   * Used in HTML: (click)="refreshData()"
   */
  loadAllData() {
    this.loading = true;
    this.error = null;

    // Load files from HISTORY CONTROLLER only (not workon)
    this.workOnService.getFullFileData(this.currentUserID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.files = response.fullFileData || [];
          this.totalFilesCount = this.files.length;
          
          // Group files by ProjectName to create projects list
          this.groupFilesByProject();
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading files:', err);
          this.error = 'Failed to load your file history';
          this.loading = false;
        }
      });
  }

  /**
   * Group files by ProjectName to create projects list
   */
  private groupFilesByProject() {
    const projectsMap = new Map<string, ProjectData>();

    this.files.forEach(file => {
      if (!projectsMap.has(file.projectName)) {
        projectsMap.set(file.projectName, {
          projectName: file.projectName,
          filesCount: 0,
          uploadDate: file.dateCreate || new Date().toISOString(),
          managerID: this.currentUserID,
          notes: file.notes
        });
      }

      const project = projectsMap.get(file.projectName)!;
      project.filesCount++;

      // Keep the earliest upload date
      if (file.dateCreate && new Date(file.dateCreate) < new Date(project.uploadDate)) {
        project.uploadDate = file.dateCreate;
      }
    });

    this.projects = Array.from(projectsMap.values());
    this.projectsCount = this.projects.length;
  }

  /**
   * Refresh all data
   * Used in HTML: (click)="refreshData()"
   */
  refreshData() {
    this.loadAllData();
  }

  /**
   * Go back to previous page
   * Used in HTML: (click)="goBack()"
   */
  goBack() {
    this.router.navigate(['/profile']);
  }

  /**
   * Format date to readable format
   * Used in HTML: {{ formatDate(project.uploadDate) }}
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Get files count for a specific project
   * Used in HTML: {{ getProjectFilesCount(project.projectName) }}
   */
  getProjectFilesCount(projectName: string): number {
    return this.files.filter(f => f.projectName === projectName).length;
  }

  /**
   * Get files for a specific project
   */
  getProjectFiles(projectName: string): FileDataFromAPI[] {
    return this.files.filter(f => f.projectName === projectName);
  }

  /**
   * Toggle project dropdown menu
   * Used in HTML: (click)="toggleProjectMenu(project.projectName)"
   */
  toggleProjectMenu(projectName: string) {
    this.openMenuId = this.openMenuId === projectName ? null : projectName;
  }

  /**
   * View project details
   * Used in HTML: (click)="viewProjectDetails(project)"
   */
  viewProjectDetails(project: ProjectData) {
    this.openMenuId = null;
    // Switch to files tab and filter by project
    // this.activeTab = 'files';
  }

  /**
   * Delete project (delete all files in the project)
   * Used in HTML: (click)="deleteProject(project.projectName)"
   */
  deleteProject(projectName: string) {
    if (!confirm(`Are you sure you want to delete project "${projectName}" and all its files?`)) {
      return;
    }

    this.openMenuId = null;
    
    // Get all files for this project
    const projectFiles = this.files.filter(f => f.projectName === projectName);
    
    // Delete all files in the project
    projectFiles.forEach(file => {
      this.workOnService.deleteFile(this.currentUserID, projectName, file.fileName)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log(`Deleted file: ${file.fileName}`);
          },
          error: (err) => {
            console.error(`Error deleting file ${file.fileName}:`, err);
          }
        });
    });

    // Update UI
    this.files = this.files.filter(f => f.projectName !== projectName);
    this.projects = this.projects.filter(p => p.projectName !== projectName);
    this.projectsCount--;
    this.totalFilesCount -= projectFiles.length;
  }

  /**
   * Download output file
   * Uses UploadService.downloadOutputFile()
   * Used in HTML: (click)="downloadFile(file)"
   */
  downloadFile(file: FileDataFromAPI) {
    console.log('📥 Downloading output file:', { 
      userId: this.currentUserID, 
      projectName: file.projectName, 
      fileName: file.fileName 
    });

    this.uploadService.downloadOutputFile(this.currentUserID, file.projectName, file.fileName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          console.log('✅ File downloaded successfully');
          
          // Extract file name without extension
          const fileNameWithoutExt = file.fileName.replace(/\.(dxf|DXF|dwg|DWG)$/i, '');
          const downloadFileName = `${fileNameWithoutExt}_output.csv`;
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = downloadFileName;
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Cleanup
          window.URL.revokeObjectURL(url);
          
          console.log('📥 File saved as:', downloadFileName);
        },
        error: (err) => {
          console.error('❌ Error downloading file:', err);
          alert(`Failed to download file: ${err.error?.message || err.message || 'Unknown error'}`);
        }
      });
  }

  /**
   * Download all files (input + output as ZIP)
   * Used in HTML: (click)="downloadAllFiles(file)"
   */
  downloadAllFiles(file: FileDataFromAPI) {
    console.log('📥 Downloading all files:', { 
      userId: this.currentUserID, 
      projectName: file.projectName, 
      fileName: file.fileName 
    });

    this.uploadService.downloadAllFiles(this.currentUserID, file.projectName, file.fileName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          console.log('✅ All files downloaded successfully');
          
          const downloadFileName = `${file.fileName}_all_files.zip`;
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = downloadFileName;
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Cleanup
          window.URL.revokeObjectURL(url);
          
          console.log('📥 ZIP file saved as:', downloadFileName);
        },
        error: (err) => {
          console.error('❌ Error downloading files:', err);
          alert(`Failed to download files: ${err.error?.message || err.message || 'Unknown error'}`);
        }
      });
  }

  /**
   * Delete file
   * Used in HTML: (click)="deleteFile(file)"
   */
  deleteFile(file: FileDataFromAPI) {
    if (!confirm(`Are you sure you want to delete "${file.fileName}"?`)) {
      return;
    }

    this.workOnService.deleteFile(this.currentUserID, file.projectName, file.fileName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Remove file from list
          this.files = this.files.filter(f => 
            !(f.projectName === file.projectName && f.fileName === file.fileName)
          );
          this.totalFilesCount--;

          // Update project files count
          const project = this.projects.find(p => p.projectName === file.projectName);
          if (project) {
            project.filesCount--;
            // If no more files in project, remove project
            if (project.filesCount === 0) {
              this.projects = this.projects.filter(p => p.projectName !== file.projectName);
              this.projectsCount--;
            }
          }
        },
        error: (err) => {
          console.error('Error deleting file:', err);
          alert('Failed to delete file');
        }
      });
  }

  /**
   * Get project by name
   */
  getProjectByName(projectName: string): ProjectData | undefined {
    return this.projects.find(p => p.projectName === projectName);
  }

  /**
   * View file result (open in file-result component)
   * Used in HTML: (click)="viewFileResult(file)"
   */
  viewFileResult(file: FileDataFromAPI) {
    // Save file info to localStorage so FileResultComponent can read it
    const fileInfo = {
      userId: this.currentUserID,
      projectName: file.projectName,
      fileName: file.fileName,
      fromHistory: true
    };
    localStorage.setItem('lastFileOutput', JSON.stringify(fileInfo));

    // Navigate to file-result with file data
    this.uploadService.setFileStorage({
      UserID: this.currentUserID,
      ProjectName: file.projectName,
      FileName: file.fileName,
      Notes: file.notes,
      InputFileData: null
    } as FileStorage);
    
    this.router.navigate(['/file-result']);
  }
}
