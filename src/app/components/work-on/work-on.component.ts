import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, map } from 'rxjs/operators';
import { WorkOnService } from '../../services/work-on.service';
import { UploadService } from '../../services/upload.service';
import { FileDataFromAPI, FileStorage, FullFileDataResponse } from '../../interfaces/FileStorage';
import { ProjectData } from '../../interfaces/FileStorage';
import { AddWorkerRequest } from '../../interfaces/FileStorage';
import { WorkerData } from '../../interfaces/FileStorage';


@Component({
  selector: 'app-work-on',
  standalone: true,
  imports: [CommonModule , FormsModule],
  templateUrl: './work-on.component.html',
  styleUrls: ['./work-on.component.css']
})
export class WorkOnComponent implements OnInit, OnDestroy {
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
  activeTab: 'my-files' | 'projects' | 'workers' = 'my-files';

  /**
   * Projects data array (grouped by ProjectName)
   * Used in HTML: *ngFor="let project of projects"
   */
  projects: ProjectData[] = [];

  /**
   * Files data array from API
   * Used in HTML: *ngFor="let file of files"
   */
  files: FileDataFromAPI[] = [];

  /**
   * Assigned files data array (files assigned to worker from API/workon)
   * Used in HTML: *ngFor="let assignedFile of assignedFiles"
   */
  assignedFiles: any[] = [];

  /**
   * Project files with counts for My Files tab
   * Used in HTML: *ngFor="let projectFile of projectFilesWithCounts"
   */
  projectFilesWithCounts: any[] = [];

  /**
   * Currently selected project name (when viewing project details)
   * Used to filter files shown in "My Files" tab
   */
  selectedProjectName: string | null = null;
  /**
   * Workers data array
   * Used in HTML: *ngFor="let worker of workers"
   */
  workers: WorkerData[] = [];

  /**
   * Statistics counters
   * Used in HTML: {{ projectsCount }}, {{ totalFilesCount }}, {{ workersCount }}
   */
  projectsCount = 0;
  totalFilesCount = 0;
  workersCount = 0;

  /**
   * Open menu ID for dropdown
   * Used in HTML: *ngIf="openMenuId === project.projectName"
   */
  openMenuId: string | null = null;

  /**
   * Add worker modal visibility
   * Used in HTML: *ngIf="showAddWorkerModal"
   */
  showAddWorkerModal = false;

  /**
   * New worker form data
   * Used in HTML: [(ngModel)]="newWorker.email"
   */
  newWorker = {
    email: '',
    projectName: '',
    role: 'Worker'
  };

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
  ) { }

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
   * Load all data (projects, files, workers)
   * Used in HTML: (click)="refreshData()"
   */
  loadAllData() {
    this.loading = true;
    this.error = null;

    // Load assigned files from work-on API ONLY
    this.workOnService.getWorkerAssignedFiles(this.currentUserID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (assignedFiles) => {
          // Transform assigned files
          this.assignedFiles = assignedFiles.map(f => ({
            managerID: f.managerID || null,
            managerName: f.managerName,
            projectName: f.projectName,
            fileName: f.fileName,
            assignedDate: f.dateCreate || f.dateCreate,
            notes: f.notes
          }));

          // Calculate stats from work-on data only
          this.totalFilesCount = this.assignedFiles.length;

          // Count unique projects from assigned files
          const uniqueProjects = new Set(this.assignedFiles.map(f => f.projectName));
          this.projectsCount = uniqueProjects.size;

          // Build projects list with manager info
          this.projects = Array.from(uniqueProjects).map(projName => {
            const firstFile = this.assignedFiles.find(f => f.projectName === projName);
            return {
              projectName: projName,
              filesCount: this.assignedFiles.filter(f => f.projectName === projName).length,
              uploadDate: firstFile?.assignedDate || new Date().toISOString(),
              managerID: firstFile?.managerID || null,
              notes: ''
            };
          });

          // Fetch manager names per project
          this.projects.forEach(proj => {
            this.workOnService.getProjectManagers(proj.projectName, this.currentUserID)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (managers) => {
                  if (managers && managers.length > 0) {
                    (proj as any).managerName = managers[0].managerName || '';
                  }
                },
                error: () => {
                  (proj as any).managerName = '';
                }
              });
          });

          // Count unique assigned managers (workers count = number of different managers)
          const uniqueManagers = new Set(this.assignedFiles.map(f => f.managerID).filter(id => id));
          this.workersCount = uniqueManagers.size;

          console.log('📊 Projects loaded:', this.projects);
          console.log('📂 Assigned files:', this.assignedFiles);

          // Load files count for each project using getFilesCountByProject
          this.loadProjectFilesCounts();

          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading assigned files:', err);
          this.error = 'Failed to load your work data';
          this.loading = false;
        }
      });
  }

/**
 * Load actual files for each project and create projectFilesWithCounts array
 */
private loadProjectFilesCounts() {
  this.projectFilesWithCounts = [];
  console.log('🔍 Assigned files:', this.assignedFiles);
  console.log('🔍 Projects:', this.projects);
  // نجمع الـ projects الفريدة من assignedFiles مع الـ managerID
  const projectsMap = new Map<string, number>();
 
  this.assignedFiles.forEach(file => {
    if (file.projectName) {
      const managerID = file.managerID || 1; // Use 1 as default if managerID is null
      projectsMap.set(file.projectName, managerID);
    }
  });
  console.log('🔍 Projects map with managerID:', Array.from(projectsMap.entries()));
  if (projectsMap.size === 0) {
    console.warn('⚠️ No projects with managerID found in assignedFiles');
    return;
  }
  // نعمل API calls لكل مشروع
  const fileObservables = Array.from(projectsMap.entries()).map(([projectName, managerID]) => {
    console.log(`📡 Calling API for project: "${projectName}" with managerID: ${managerID}`);
   
    return this.uploadService.getFullFileData2(managerID, projectName)
      .pipe(
        map(response => response as unknown as any[]),
        catchError(err => {
          console.error(`❌ Error loading files for ${projectName}:`, err);
          return of([]);
        }),
        map(files => {
          console.log(`✅ API Response for ${projectName}:`, files);
          console.log(`📂 Files count: ${files.length}`);
         
          const managerName = this.assignedFiles.find(f => f.projectName === projectName)?.managerName || 'Unknown Manager';
         
          return files.map((file: any) => ({
            projectName: projectName,
            managerName: managerName,
            fileName: file.fileName || '',
            managerID: managerID,
            dateCreate: file.dateCreate,
            notes: file.notes
          }));
        })
      );
  });
  forkJoin(fileObservables)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (results) => {
        this.projectFilesWithCounts = results.flat().sort((a, b) =>
          a.projectName.localeCompare(b.projectName)
        );
        console.log('✅✅✅ FINAL projectFilesWithCounts:', this.projectFilesWithCounts);
      },
      error: (err) => {
        console.error('❌ Error in forkJoin:', err);
      }
    });
}


  /**
   * Load assigned files for this worker from API/workon
   */
  private loadAssignedFiles() {
    this.workOnService.getWorkerAssignedFiles(this.currentUserID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (assignedFiles) => {
          // Transform the response to include manager name and project name
          this.assignedFiles = assignedFiles.map(file => ({
            managerID: file.managerID || file.managerID || null,
            managerName: file.managerName || (file.email ? file.email.split('@')[0] : 'Manager'),
            projectName: file.projectName,
            fileName: file.fileName,
            assignedDate: file.dateCreate,
            notes: file.notes
          }));

          // update overall files count in case assigned list is authoritative
          this.totalFilesCount = this.files.length;
        },
        error: (err) => {
          console.error('Error loading assigned files:', err);
          this.assignedFiles = [];
        }
      });
  }

  /**
   * Load workers for all projects
   */
  private loadAllWorkers() {
    this.workers = [];

    // Load workers for each project
    this.projects.forEach(project => {
      this.workOnService.getWorkers(this.currentUserID, project.projectName)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (workers) => {
            // Add project name to each worker and merge with existing workers
            const projectWorkers = workers.map(w => ({
              ...w,
              projectName: project.projectName
            }));
            this.workers = [...this.workers, ...projectWorkers];
            // Count unique workers assigned by this manager (by userId or email)
            const uniqueKeys = new Set(this.workers.map(w => w.userId ?? w.email ?? w.userName));
            this.workersCount = uniqueKeys.size;
          },
          error: (err) => {
            console.error(`Error loading workers for ${project.projectName}:`, err);
          }
        });
    });
  }

  /**
   * Group files by ProjectName to create projects list
   */
  private groupFilesByProject() {
    const projectsMap = new Map<string, ProjectData>();

    this.files.forEach(file => {
      if (!projectsMap.has(file.projectName)) {
        // Try to detect manager id from file if available
        const mgrId = (file as any).managerID || (file as any).managerId || null;
        projectsMap.set(file.projectName, {
          projectName: file.projectName,
          filesCount: 0,
          uploadDate: file.dateCreate || new Date().toISOString(),
          managerID: mgrId,
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

    // Try to fetch manager name for each project to display in Projects tab
    this.projects.forEach(project => {
      this.workOnService.getProjectManagers(project.projectName, this.currentUserID)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (managers) => {
            if (managers && managers.length > 0) {
              (project as any).managerName = managers[0].managerName || managers[0].managerName || '';
            } else {
              (project as any).managerName = '';
            }
          },
          error: () => {
            (project as any).managerName = '';
          }
        });
    });
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
    // Switch to My Files tab and show all files for this project (one row per file)
    this.selectedProjectName = project.projectName;
    this.activeTab = 'my-files';

    const projectFiles = this.getProjectFiles(project.projectName);
    this.assignedFiles = projectFiles.map(f => ({
      managerID: (f as any).managerID || (f as any).managerId || (project as any).managerID || null,
      managerName: (f as any).managerName || (project as any).managerName || this.currentUserName,
      projectName: f.projectName,
      fileName: f.fileName,
      assignedDate: f.dateCreate,
      notes: f.notes
    }));
  }

  /**
   * View project manager information
   * Used in HTML: (click)="viewProjectManager(project)"
   */
  viewProjectManager(project: ProjectData) {
    this.openMenuId = null;
    this.workOnService.getProjectManagers(project.projectName, this.currentUserID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (managers) => {
          if (managers && managers.length > 0) {
            const managerNames = managers.map(m => m.managerName).join(', ');
            alert(`Project Manager(s): ${managerNames}`);
          } else {
            alert('No manager found for this project');
          }
        },
        error: (err) => {
          console.error('Error loading manager info:', err);
          alert('Failed to load manager information');
        }
      });
  }

  /**
   * Delete project (delete all files in the project)
   * Used in HTML: (click)="deleteProject(project.projectName)"
   */
  deleteProject(projectName: string) {
    if (!confirm(`Are you sure you want to delete project "${projectName}" and all its files?`)) {
      return;
    }

    const projectFiles = this.files.filter(f => f.projectName === projectName);
    this.files = this.files.filter(f => f.projectName !== projectName);
    this.projects = this.projects.filter(p => p.projectName !== projectName);
    this.projectsCount = Math.max(0, this.projectsCount - 1);
    this.totalFilesCount = Math.max(0, this.totalFilesCount - projectFiles.length);
  }

  /**
   * Download output file (Column 3)
   * Uses UploadService.downloadOutputFile() - same as History component
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
   * Get worker initials for avatar
   * Used in HTML: {{ getWorkerInitials(worker.userName) }}
   */
  getWorkerInitials(userName: string): string {
    if (!userName) return 'W';

    const names = userName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return userName[0].toUpperCase();
  }

  /**
   * Open add worker modal
   * Used in HTML: (click)="openAddWorkerModal()"
   */
  openAddWorkerModal() {
    if (this.projects.length === 0) {
      alert('Please create a project first before adding workers');
      return;
    }
    this.showAddWorkerModal = true;
    this.newWorker = { email: '', projectName: '', role: 'Worker' };
  }

  /**
   * Close add worker modal
   * Used in HTML: (click)="closeAddWorkerModal()"
   */
  closeAddWorkerModal() {
    this.showAddWorkerModal = false;
    this.newWorker = { email: '', projectName: '', role: 'Worker' };
  }

  /**
   * Add new worker
   * Used in HTML: (click)="addWorker()"
   */
  addWorker() {
    if (!this.newWorker.email || !this.newWorker.projectName) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newWorker.email)) {
      alert('Please enter a valid email address');
      return;
    }

    this.workOnService.addWorkerByEmail({
      email: this.newWorker.email,
      managerID: this.currentUserID,
      projectName: this.newWorker.projectName,
      role: this.newWorker.role
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (worker) => {
          this.workers.push(worker);
          this.workersCount++;
          this.closeAddWorkerModal();
          alert('Worker added successfully');
        },
        error: (err) => {
          console.error('Error adding worker:', err);
          alert(err.message || 'Failed to add worker. Please check if the email exists.');
        }
      });
  }

  /**
   * Remove worker
   * Used in HTML: (click)="removeWorker(worker)"
   */
  removeWorker(worker: WorkerData) {
    if (!confirm(`Are you sure you want to remove ${worker.userName} from ${worker.projectName}?`)) {
      return;
    }

    // Use email-based removal if worker has email, otherwise use userId
    if (worker.email) {
      this.workOnService.removeWorkerByEmail(worker.email, this.currentUserID, worker.projectName)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.workers = this.workers.filter(w =>
              !(w.email === worker.email &&
                w.managerID === worker.managerID &&
                w.projectName === worker.projectName)
            );
            this.workersCount--;
            alert('Worker removed successfully');
          },
          error: (err) => {
            console.error('Error removing worker:', err);
            alert('Failed to remove worker');
          }
        });
    } else {
      this.workOnService.removeWorker(worker.userId, worker.managerID, worker.projectName)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.workers = this.workers.filter(w =>
              !(w.userId === worker.userId &&
                w.managerID === worker.managerID &&
                w.projectName === worker.projectName)
            );
            this.workersCount--;
            alert('Worker removed successfully');
          },
          error: (err) => {
            console.error('Error removing worker:', err);
            alert('Failed to remove worker');
          }
        });
    }
  }

  /**
   * Get assigned files for a worker
   */
  getWorkerFiles(worker: WorkerData): FileDataFromAPI[] {
    return this.files.filter(f => f.projectName === worker.projectName);
  }

  /**
   * Filter workers by project
   */
  getWorkersForProject(projectName: string): WorkerData[] {
    return this.workers.filter(w => w.projectName === projectName);
  }

  /**
   * Get project by name
   */
  getProjectByName(projectName: string): ProjectData | undefined {
    return this.projects.find(p => p.projectName === projectName);
  }

  /**
   * View file result (open in file-result component)
   * Used in HTML: (click)="viewFileResult(assignedFile)"
   */
  viewFileResult(assignedFile: any) {
    // Navigate to file-result with file data
    this.uploadService.setFileStorage({
      UserID: this.currentUserID,
      ProjectName: assignedFile.projectName,
      FileName: assignedFile.fileName,
      Notes: assignedFile.notes,
      managerID: assignedFile.managerID,
      managerName: assignedFile.managerName,
      InputFileData: null
    } as FileStorage);

    this.router.navigate(['/file-result']);
  }
}