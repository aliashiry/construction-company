import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WorkOnService } from '../../services/workon.service';
import { UploadService } from '../../services/upload.service';
import { FileDataFromAPI } from '../../interfaces/FileStorage';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-work-on',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './work-on.component.html',
  styleUrls: ['./work-on.component.css']
})
export class WorkOnComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  activeTab: 'my-files' | 'projects' | 'workers' = 'my-files';

  // My Files Tab
  myFiles: FileDataFromAPI[] = [];
  projectFilesWithCounts: any[] = [];
  filesCount = 0;

  // Projects Tab (projects I'm working on but not managing)
  projects: any[] = [];
  projectsCount = 0;

  // Workers Tab (workers assigned to me as manager)
  workers: any[] = [];
  workersCount = 0;

  // Admin Projects (projects I manage - for add worker modal)
  adminProjects: any[] = [];
  hasAdminProjects = false;

  // Add Worker Modal
  showAddWorkerModal = false;
  newWorker = {
    email: '',
    projectName: '',
    role: 'Worker'
  };

  // Worker roles dropdown
  workerRoles = ['Worker'];

  // Menu
  openMenuId: string | null = null;

  private destroy$ = new Subject<void>();
  private currentUserID: number = 0;
  private currentUserName: string = '';

  constructor(
    private router: Router,
    private workOnService: WorkOnService,
    private uploadService: UploadService,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    const userStr = localStorage.getItem('CURRENT_USER');
    if (!userStr) {
      this.router.navigate(['/login']);
      return;
    }

    const user = JSON.parse(userStr);
    this.currentUserID = user.id;
    this.currentUserName = user.name || user.fullName || 'User';

    this.loadAllData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData() {
    this.loading = true;
    this.error = null;

    // 1. Load files assigned to me (as worker)
    this.workOnService.getWorkerAssignedFiles(this.currentUserID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (files) => {
          this.myFiles = files || [];
          this.filesCount = this.myFiles.length;
          this.buildProjectFilesWithCounts();
        },
        error: (err) => {
          this.error = 'Failed to load your files';
          this.loading = false;
        }
      });

    // 2. Load projects I'm working on (as worker)
    this.workOnService.getWorkerProjects(this.currentUserID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.projects) {
            const uniqueProjects = new Map<string, any>();
            response.projects.forEach((p: any) => {
              if (!uniqueProjects.has(p.projectName)) {
                uniqueProjects.set(p.projectName, {
                  projectName: p.projectName,
                  managerName: p.managerName,
                  managerId: p.managerId,
                  filesCount: 0,
                  assignedDate: p.assignedDate
                });
              }
              uniqueProjects.get(p.projectName)!.filesCount++;
            });
            
            this.projects = Array.from(uniqueProjects.values());
            this.projectsCount = this.projects.length;
          }
          this.loading = false;
        },
        error: (err) => {
          this.projects = [];
          this.projectsCount = 0;
          this.loading = false;
        }
      });

    // 3. Load admin projects (projects I manage)
    this.uploadService.getAllProjects(this.currentUserID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projectNames: string[]) => {
          if (projectNames && projectNames.length > 0) {
            this.adminProjects = projectNames.map(name => ({
              projectName: name
            }));
            this.hasAdminProjects = true;
          } else {
            this.adminProjects = [];
            this.hasAdminProjects = false;
          }
        },
        error: (err) => {
          this.adminProjects = [];
          this.hasAdminProjects = false;
        }
      });

    // 4. Load workers (if I'm a manager)
    this.workOnService.getWorkersForManager(this.currentUserID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.workers) {
            this.workers = response.workers.map((w: any) => ({
              workerName: w.workerName,
              projectName: w.projectName,
              assignedDate: w.assignedDate,
              initials: this.getInitials(w.workerName)
            }));
            this.workersCount = response.workersCount || 0;
          }
        },
        error: (err) => {
          this.workers = [];
          this.workersCount = 0;
        }
      });
  }

  private buildProjectFilesWithCounts() {
    const projectMap = new Map<string, any>();
    
    this.myFiles.forEach(file => {
      if (!projectMap.has(file.projectName)) {
        projectMap.set(file.projectName, {
          projectName: file.projectName,
          files: []
        });
      }
      projectMap.get(file.projectName)!.files.push(file);
    });

    this.projectFilesWithCounts = [];
    projectMap.forEach((project) => {
      project.files.forEach((file: FileDataFromAPI) => {
        this.projectFilesWithCounts.push({
          projectName: project.projectName,
          fileName: file.fileName,
          notes: file.notes || 'No notes'
        });
      });
    });
  }

  refreshData() {
    this.loadAllData();
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }

  toggleProjectMenu(projectName: string) {
    this.openMenuId = this.openMenuId === projectName ? null : projectName;
  }

  viewProjectDetails(project: any) {
    this.openMenuId = null;
    this.activeTab = 'my-files';
  }

  openAddWorkerModal() {
    // فقط اذا كنت مدير في مشروع واحد على الأقل
    if (!this.hasAdminProjects || this.adminProjects.length === 0) {
      alert('You don\'t have any projects to assign workers to. Create a project first.');
      return;
    }
    this.showAddWorkerModal = true;
    this.newWorker = { email: '', projectName: this.adminProjects[0].projectName, role: 'Worker' };
  }

  closeAddWorkerModal() {
    this.showAddWorkerModal = false;
  }

  addWorker() {
    if (!this.newWorker.email || !this.newWorker.projectName) {
      alert('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newWorker.email)) {
      alert('Invalid email format');
      return;
    }

    this.workOnService.addWorkerByEmail({
      useremail: this.newWorker.email,
      managerId: this.currentUserID,
      projectName: this.newWorker.projectName
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        alert('Worker added successfully');
        this.closeAddWorkerModal();
        this.loadAllData();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add worker');
      }
    });
  }

  removeWorker(worker: any) {
    if (!confirm(`Remove ${worker.workerName} from ${worker.projectName}?`)) {
      return;
    }

    this.workOnService.removeWorkerByEmail({
      workerEmail: worker.workerName,
      managerId: this.currentUserID,
      projectName: worker.projectName
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        alert('Worker removed successfully');
        this.loadAllData();
      },
      error: (err) => {
        alert('Failed to remove worker');
      }
    });
  }

  downloadFile(file: FileDataFromAPI) {
    this.uploadService.downloadOutputFile(
      this.currentUserID, 
      file.projectName, 
      file.fileName
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (blob) => {
        const fileNameWithoutExt = file.fileName.replace(/\.(dxf|DXF|dwg|DWG)$/i, '');
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileNameWithoutExt}_output.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert('Failed to download file');
      }
    });
  }

  getWorkersForProject(projectName: string): any[] {
    return this.workers.filter(w => w.projectName === projectName);
  }
}
