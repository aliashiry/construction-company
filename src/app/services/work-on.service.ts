// import { Injectable } from '@angular/core';
// import { catchError, Observable } from 'rxjs';
// import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
// import { throwError } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { FileStorage, Project, WorkerData } from '../interfaces/FileStorage';
// import { FileData, FullFileDataResponse } from '../interfaces/FileStorage';
// import { AddWorkerRequest } from '../interfaces/FileStorage';
// import { FileDataFromAPI } from '../interfaces/FileStorage';
// import { API } from '../constants/app.constants';


// @Injectable({
//   providedIn: 'root'
// })
// export class WorkOnService {
//  /**
//    * Base API URL - update this with your actual API endpoint
//    */
//   private readonly API_URL = `${API.BASE_URL}`;

//   constructor(private http: HttpClient) {}

//   /**
//    * Get HTTP headers with authorization token
//    */
//   private getHeaders(): HttpHeaders {
//     const token = localStorage.getItem('AUTH_TOKEN') || '';
//     return new HttpHeaders({
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`
//     });
//   }

//   /**
//    * Handle HTTP errors
//    */
//   private handleError(error: any): Observable<never> {
//     console.error('API Error:', error);
//     const errorMessage = error.error?.message || error.message || 'An error occurred';
//     return throwError(() => new Error(errorMessage));
//   }

//   // ==================== FileStorage APIs ====================

//   /**
//    * GET /api/history/files/full-data
//    * Get full data of all files for a specific Manager (User)
//    * Based on ERD: FileStorage.ManagerID → User.UserID
//    */
//   getFullFileData(managerID: number): Observable<FullFileDataResponse> {
//     const params = new HttpParams().set('userId', managerID.toString());
    
//     return this.http.get<FullFileDataResponse>(
//       `${this.API_URL}/history/files/full-data`,
//       { 
//         headers: this.getHeaders(),
//         params 
//       }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * GET /api/history/files
//    * Get all files for a manager
//    * Returns: FileDataFromAPI[]
//    */
//   getFiles(managerID: number): Observable<FileDataFromAPI[]> {
//     const params = new HttpParams().set('userId', managerID.toString());
    
//     return this.http.get<{ files: FileDataFromAPI[] }>(
//       `${this.API_URL}/history/files`,
//       { 
//         headers: this.getHeaders(),
//         params 
//       }
//     ).pipe(
//       map(response => response.files || []),
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * GET /api/history/files/count
//    * Get total count of files for a manager
//    */
//   getFilesCount(managerID: number): Observable<number> {
//     const params = new HttpParams().set('userId', managerID.toString());
    
//     return this.http.get<{ count: number }>(
//       `${this.API_URL}/history/files/count`,
//       { 
//         headers: this.getHeaders(),
//         params 
//       }
//     ).pipe(
//       map(response => response.count || 0),
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * GET /api/history/projects/count
//    * Get count of unique projects for a manager
//    */
//   getProjectsCount(managerID: number): Observable<number> {
//     const params = new HttpParams().set('userId', managerID.toString());
    
//     return this.http.get<{ count: number }>(
//       `${this.API_URL}/history/projects/count`,
//       { 
//         headers: this.getHeaders(),
//         params 
//       }
//     ).pipe(
//       map(response => response.count || 0),
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * POST /api/history/input
//    * Upload new file (Create new FileStorage entry)
//    * 
//    * Based on ERD:
//    * - ManagerID (FK → User.UserID)
//    * - ProjectName (Part of composite PK)
//    * - FileName (Part of composite PK)
//    * - InputFileData (byte[])
//    * - UploadDate (DateOnly, default Today)
//    * - Notes (string?, nullable)
//    */
//   uploadFile(fileData: FileStorage): Observable<any> {
//     const formData = new FormData();
//     formData.append('UserID', fileData.UserID.toString());
//     formData.append('ProjectName', fileData.ProjectName);
//     formData.append('FileName', fileData.FileName);
//     if (fileData.InputFileData) {
//       formData.append('InputFileData', fileData.InputFileData);
//     }
//     formData.append('Notes', fileData.Notes || '');

//     return this.http.post(
//       `${this.API_URL}/history/input`,
//       formData,
//       { 
//         headers: new HttpHeaders({
//           'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN') || ''}`
//         })
//       }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * POST /api/history/output
//    * Upload/Process output file
//    */
//   uploadOutputFile(outputData: {
//     managerID: number;
//     projectName: string;
//     fileName: string;
//     outputFileData: Blob;
//   }): Observable<any> {
//     const formData = new FormData();
//     formData.append('ManagerID', outputData.managerID.toString());
//     formData.append('ProjectName', outputData.projectName);
//     formData.append('FileName', outputData.fileName);
//     formData.append('OutputFileData', outputData.outputFileData);

//     return this.http.post(
//       `${this.API_URL}/history/output`,
//       formData,
//       { 
//         headers: new HttpHeaders({
//           'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN') || ''}`
//         })
//       }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * GET /api/history/output/download
//    * Download output file
//    * Query params: managerID, projectName, fileName
//    */
//   downloadFile(managerID: number, projectName: string, fileName: string): Observable<Blob> {
//     const params = new HttpParams()
//       .set('managerID', managerID.toString())
//       .set('projectName', projectName)
//       .set('fileName', fileName);

//     return this.http.get(
//       `${this.API_URL}/history/output/download`,
//       { 
//         headers: this.getHeaders(),
//         params,
//         responseType: 'blob'
//       }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * GET /api/history/output/download/all
//    * Download all files for a manager
//    */
//   downloadAllFiles(managerID: number): Observable<Blob> {
//     const params = new HttpParams().set('managerID', managerID.toString());

//     return this.http.get(
//       `${this.API_URL}/history/output/download/all`,
//       { 
//         headers: this.getHeaders(),
//         params,
//         responseType: 'blob'
//       }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * GET /api/history/output/status
//    * Check file processing status
//    */
//   getFileStatus(managerID: number, projectName: string, fileName: string): Observable<{ status: string; progress?: number }> {
//     const params = new HttpParams()
//       .set('managerID', managerID.toString())
//       .set('projectName', projectName)
//       .set('fileName', fileName);

//     return this.http.get<{ status: string; progress?: number }>(
//       `${this.API_URL}/history/output/status`,
//       { 
//         headers: this.getHeaders(),
//         params 
//       }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * DELETE File
//    * Delete a file from FileStorage
//    * Composite Key: (ManagerID, ProjectName, FileName)
//    */
//   deleteFile(managerID: number, projectName: string, fileName: string): Observable<any> {
//     const params = new HttpParams()
//       .set('managerID', managerID.toString())
//       .set('projectName', projectName)
//       .set('fileName', fileName);

//     return this.http.delete(
//       `${this.API_URL}/history/file/delete`,
//       { 
//         headers: this.getHeaders(),
//         params 
//       }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   // ==================== WorkerOn APIs ====================

//   /**
//    * GET /api/WorkerOn
//    * Get all workers assigned to manager's projects
//    * 
//    * Based on ERD:
//    * - WorkerOn.ManagerID → User.UserID (as Manager)
//    * - WorkerOn.UserId → User.UserID (as Worker)
//    * - WorkerOn composite FK: (ManagerID, ProjectName) → FileStorage(ManagerID, ProjectName)
//    */
//   getWorkers(managerID: number): Observable<WorkerData[]> {
//     const params = new HttpParams().set('managerID', managerID.toString());
    
//     return this.http.get<WorkerData[]>(
//       `${this.API_URL}/WorkerOn`,
//       { 
//         headers: this.getHeaders(),
//         params 
//       }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * GET /api/WorkerOn/assign/MyFiles/{userId}
//    * Get files assigned to a specific worker
//    * Returns files from projects where worker is assigned
//    */
//   getWorkerAssignedFiles(userId: number): Observable<FileDataFromAPI[]> {
//     return this.http.get<FileDataFromAPI[]>(
//       `${this.API_URL}/WorkerOn/assign/MyFiles/${userId}`,
//       { headers: this.getHeaders() }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * GET /api/WorkerOn/manager/{projectName}
//    * Get manager information for a specific project
//    */
//   getProjectManager(projectName: string): Observable<{
//     managerID: number;
//     fullName: string;
//     email: string;
//   }> {
//     return this.http.get<{
//       managerID: number;
//       fullName: string;
//       email: string;
//     }>(
//       `${this.API_URL}/WorkerOn/manager/${encodeURIComponent(projectName)}`,
//       { headers: this.getHeaders() }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * POST /api/WorkerOn/addworker
//    * Add a new worker to a project
//    * 
//    * Based on ERD:
//    * - UserId (FK → User.UserID) - The worker
//    * - ManagerID (FK composite → FileStorage.ManagerID)
//    * - ProjectName (FK composite → FileStorage.ProjectName)
//    * - AssignedDate (DateTime, default Now)
//    * 
//    * Primary Key: (UserId, ManagerID, ProjectName)
//    */
//   addWorker(workerData: AddWorkerRequest): Observable<WorkerData> {
//     return this.http.post<WorkerData>(
//       `${this.API_URL}/WorkerOn/addworker`,
//       {
//         userId: workerData.userId,
//         userName: workerData.userName,
//         managerID: workerData.managerID,
//         projectName: workerData.projectName,
//         role: workerData.role || 'Worker',
//         assignedDate: new Date().toISOString()
//       },
//       { headers: this.getHeaders() }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * DELETE /api/WorkerOn/rmworker
//    * Remove a worker from a project
//    * 
//    * Composite Primary Key: (UserId, ManagerID, ProjectName)
//    */
//   removeWorker(userId: number, managerID: number, projectName: string): Observable<any> {
//     const params = new HttpParams()
//       .set('userId', userId.toString())
//       .set('managerID', managerID.toString())
//       .set('projectName', projectName);

//     return this.http.delete(
//       `${this.API_URL}/WorkerOn/rmworker`,
//       { 
//         headers: this.getHeaders(),
//         params 
//       }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * POST /api/WorkerOn/editoutputfile
//    * Edit output file information
//    * Allows worker to update/edit output file data
//    */
//   editOutputFile(fileData: {
//     userId: number;
//     managerID: number;
//     projectName: string;
//     fileName: string;
//     outputFileData?: Blob;
//     notes?: string;
//   }): Observable<any> {
//     const formData = new FormData();
//     formData.append('UserId', fileData.userId.toString());
//     formData.append('ManagerID', fileData.managerID.toString());
//     formData.append('ProjectName', fileData.projectName);
//     formData.append('FileName', fileData.fileName);
    
//     if (fileData.outputFileData) {
//       formData.append('OutputFileData', fileData.outputFileData);
//     }
//     if (fileData.notes) {
//       formData.append('Notes', fileData.notes);
//     }

//     return this.http.post(
//       `${this.API_URL}/WorkerOn/editoutputfile`,
//       formData,
//       { 
//         headers: new HttpHeaders({
//           'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN') || ''}`
//         })
//       }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   // ==================== Projects APIs ====================

//   /**
//    * GET /api/history/projects
//    * Get all unique projects (distinct ProjectNames) for a manager
//    */
//   getProjects(managerID: number): Observable<{
//     projectName: string;
//     filesCount: number;
//     uploadDate: string;
//   }[]> {
//     const params = new HttpParams().set('managerID', managerID.toString());
    
//     return this.http.get<{
//       projectName: string;
//       filesCount: number;
//       uploadDate: string;
//     }[]>(
//       `${this.API_URL}/history/projects`,
//       { 
//         headers: this.getHeaders(),
//         params 
//       }
//     ).pipe(
//       catchError(this.handleError)
//     );
//   }

//   // ==================== Helper Methods ====================

//   /**
//    * Format file size to readable format
//    */
//   formatFileSize(bytes: number): string {
//     if (bytes === 0) return '0 Bytes';
    
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
    
//     return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
//   }

//   /**
//    * Check if file is an image
//    */
//   isImageFile(filename: string): boolean {
//     const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
//     const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
//     return imageExtensions.includes(extension);
//   }

//   /**
//    * Get file extension
//    */
//   getFileExtension(filename: string): string {
//     return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
//   }

//   /**
//    * Get file icon based on extension
//    */
//   getFileIcon(filename: string): string {
//     const extension = this.getFileExtension(filename);
    
//     const iconMap: { [key: string]: string } = {
//       'pdf': '📄',
//       'doc': '📝', 'docx': '📝',
//       'xls': '📊', 'xlsx': '📊',
//       'ppt': '📊', 'pptx': '📊',
//       'txt': '📋',
//       'zip': '🗜️', 'rar': '🗜️',
//       'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
//       'mp4': '🎬', 'avi': '🎬',
//       'mp3': '🎵', 'wav': '🎵'
//     };
    
//     return iconMap[extension] || '📁';
//   }

//   /**
//    * Validate file type
//    */
//   isValidFileType(filename: string, allowedTypes: string[]): boolean {
//     const extension = this.getFileExtension(filename);
//     return allowedTypes.includes(extension);
//   }

//   /**
//    * Calculate days difference from date
//    */
//   getDaysDifference(dateString: string): number {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffTime = Math.abs(now.getTime() - date.getTime());
//     return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//   }
// }

import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { FileStorage, Project, WorkerData } from '../interfaces/FileStorage';
import { FileData, FullFileDataResponse } from '../interfaces/FileStorage';
import { AddWorkerRequest } from '../interfaces/FileStorage';
import { FileDataFromAPI } from '../interfaces/FileStorage';
import { API } from '../constants/app.constants';


@Injectable({
  providedIn: 'root'
})
export class WorkOnService {
 /**
   * Base API URL - update this with your actual API endpoint
   */
  private readonly API_URL = `${API.BASE_URL}`;

  constructor(private http: HttpClient) {}

  /**
   * Get HTTP headers with authorization token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('AUTH_TOKEN') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    const errorMessage = error.error?.message || error.message || 'An error occurred';
    return throwError(() => new Error(errorMessage));
  }

  // ==================== FileStorage APIs ====================

  /**
   * GET /api/history/files/full-data
   * Get full data of all files for a specific Manager (User)
   * Based on ERD: FileStorage.ManagerID → User.UserID
   */
  getFullFileData(managerID: number): Observable<FullFileDataResponse> {
    const params = new HttpParams().set('userId', managerID.toString());
    
    return this.http.get<FullFileDataResponse>(
      `${this.API_URL}/history/files/full-data`,
      { 
        headers: this.getHeaders(),
        params 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/history/files
   * Get all files for a manager
   * Returns: FileDataFromAPI[]
   */
  getFiles(managerID: number): Observable<FileDataFromAPI[]> {
    const params = new HttpParams().set('userId', managerID.toString());
    
    return this.http.get<{ files: FileDataFromAPI[] }>(
      `${this.API_URL}/history/files`,
      { 
        headers: this.getHeaders(),
        params 
      }
    ).pipe(
      map(response => response.files || []),
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/history/files/count
   * Get total count of files for a manager
   */
  getFilesCount(managerID: number): Observable<number> {
    const params = new HttpParams().set('userId', managerID.toString());
    
    return this.http.get<{ count: number }>(
      `${this.API_URL}/history/files/count`,
      { 
        headers: this.getHeaders(),
        params 
      }
    ).pipe(
      map(response => response.count || 0),
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/history/projects/count
   * Get count of unique projects for a manager
   */
  getProjectsCount(managerID: number): Observable<number> {
    const params = new HttpParams().set('userId', managerID.toString());
    
    return this.http.get<{ count: number }>(
      `${this.API_URL}/history/projects/count`,
      { 
        headers: this.getHeaders(),
        params 
      }
    ).pipe(
      map(response => response.count || 0),
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/history/input
   * Upload new file (Create new FileStorage entry)
   * 
   * Based on ERD:
   * - ManagerID (FK → User.UserID)
   * - ProjectName (Part of composite PK)
   * - FileName (Part of composite PK)
   * - InputFileData (byte[])
   * - UploadDate (DateOnly, default Today)
   * - Notes (string?, nullable)
   */
  uploadFile(fileData: FileStorage): Observable<any> {
    const formData = new FormData();
    formData.append('UserID', fileData.UserID.toString());
    formData.append('ProjectName', fileData.ProjectName);
    formData.append('FileName', fileData.FileName);
    if (fileData.InputFileData) {
      formData.append('InputFileData', fileData.InputFileData);
    }
    formData.append('Notes', fileData.Notes || '');

    return this.http.post(
      `${this.API_URL}/history/input`,
      formData,
      { 
        headers: new HttpHeaders({
          'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN') || ''}`
        })
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/history/output
   * Upload/Process output file
   */
  uploadOutputFile(outputData: {
    managerID: number;
    projectName: string;
    fileName: string;
    outputFileData: Blob;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('ManagerID', outputData.managerID.toString());
    formData.append('ProjectName', outputData.projectName);
    formData.append('FileName', outputData.fileName);
    formData.append('OutputFileData', outputData.outputFileData);

    return this.http.post(
      `${this.API_URL}/history/output`,
      formData,
      { 
        headers: new HttpHeaders({
          'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN') || ''}`
        })
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/history/output/download
   * Download output file
   * Query params: managerID, projectName, fileName
   */
  downloadFile(managerID: number, projectName: string, fileName: string): Observable<Blob> {
    const params = new HttpParams()
      .set('managerID', managerID.toString())
      .set('projectName', projectName)
      .set('fileName', fileName);

    return this.http.get(
      `${this.API_URL}/history/output/download`,
      { 
        headers: this.getHeaders(),
        params,
        responseType: 'blob'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/history/output/download/all
   * Download all files for a manager
   */
  downloadAllFiles(managerID: number): Observable<Blob> {
    const params = new HttpParams().set('managerID', managerID.toString());

    return this.http.get(
      `${this.API_URL}/history/output/download/all`,
      { 
        headers: this.getHeaders(),
        params,
        responseType: 'blob'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/history/output/status
   * Check file processing status
   */
  getFileStatus(managerID: number, projectName: string, fileName: string): Observable<{ status: string; progress?: number }> {
    const params = new HttpParams()
      .set('managerID', managerID.toString())
      .set('projectName', projectName)
      .set('fileName', fileName);

    return this.http.get<{ status: string; progress?: number }>(
      `${this.API_URL}/history/output/status`,
      { 
        headers: this.getHeaders(),
        params 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * DELETE File
   * Delete a file from FileStorage
   * Composite Key: (ManagerID, ProjectName, FileName)
   */
  deleteFile(managerID: number, projectName: string, fileName: string): Observable<any> {
    const params = new HttpParams()
      .set('managerID', managerID.toString())
      .set('projectName', projectName)
      .set('fileName', fileName);

    return this.http.delete(
      `${this.API_URL}/history/file/delete`,
      { 
        headers: this.getHeaders(),
        params 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

 // ==================== WorkerOn APIs ====================

  /**
   * GET /api/WorkerOn
   * Get all workers assigned to manager's projects
   * Query params: managerId, projectName
   */
  getWorkers(managerID: number, projectName?: string): Observable<WorkerData[]> {
    let params = new HttpParams().set('managerId', managerID.toString());
    
    if (projectName) {
      params = params.set('projectName', projectName);
    }
    
    return this.http.get<WorkerData[]>(
      `${this.API_URL}/WorkerOn`,
      { 
        headers: this.getHeaders(),
        params 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/WorkerOn/assign/MyFiles/{userId}
   * Get files assigned to a specific worker
   * Returns files from projects where worker is assigned
   */
  getWorkerAssignedFiles(userId: number): Observable<FileDataFromAPI[]> {
    return this.http.get<FileDataFromAPI[]>(
      `${this.API_URL}/WorkerOn/assign/MyFiles/${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/WorkerOn/manager/{projectname}
   * Get manager information for a specific project
   * Query param: userid (the worker's user id)
   */
  getProjectManagers(projectName: string, userId: number): Observable<{
    managerID: number;
    managerName: string;
  }[]> {
    const params = new HttpParams().set('userid', userId.toString());
    
    return this.http.get<{
      managerID: number;
      managerName: string;
    }[]>(
      `${this.API_URL}/WorkerOn/manager/${encodeURIComponent(projectName)}`,
      { 
        headers: this.getHeaders(),
        params 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/WorkerOn/addworker
   * Add a new worker to a project by email
   * Backend will look up the user by email and add them to the project
   */
  addWorkerByEmail(workerData: {
    email: string;
    managerID: number;
    projectName: string;
    role?: string;
  }): Observable<WorkerData> {
    return this.http.post<WorkerData>(
      `${this.API_URL}/WorkerOn/addworker`,
      {
        useremail: workerData.email,
        ManagerID: workerData.managerID,
        ProjectName: workerData.projectName,
        role: workerData.role || 'Worker'
      },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/WorkerOn/addworker
   * Add a new worker to a project (old version - by userId)
   */
  addWorker(workerData: AddWorkerRequest): Observable<WorkerData> {
    return this.http.post<WorkerData>(
      `${this.API_URL}/WorkerOn/addworker`,
      {
        userId: workerData.userId,
        userName: workerData.userName,
        managerID: workerData.managerID,
        projectName: workerData.projectName,
        role: workerData.role || 'Worker',
        assignedDate: new Date().toISOString()
      },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * DELETE /api/WorkerOn/rmworker
   * Remove a worker from a project using worker's email
   * Body: { WorkerEmail, ManagerID, ProjectName }
   */
  removeWorkerByEmail(workerEmail: string, managerID: number, projectName: string): Observable<any> {
    return this.http.delete(
      `${this.API_URL}/WorkerOn/rmworker`,
      { 
        headers: this.getHeaders(),
        body: {
          WorkerEmail: workerEmail,
          ManagerID: managerID,
          ProjectName: projectName
        }
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * DELETE /api/WorkerOn/rmworker
   * Remove a worker from a project (old version - by userId)
   */
  removeWorker(userId: number, managerID: number, projectName: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('managerID', managerID.toString())
      .set('projectName', projectName);

    return this.http.delete(
      `${this.API_URL}/WorkerOn/rmworker`,
      { 
        headers: this.getHeaders(),
        params 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/WorkerOn/editoutputfile
   * Edit output file information
   * Allows worker to update/edit output file data
   */
  editOutputFile(fileData: {
    userId: number;
    managerID: number;
    projectName: string;
    fileName: string;
    outputFileData?: Blob;
    notes?: string;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('UserId', fileData.userId.toString());
    formData.append('ManagerID', fileData.managerID.toString());
    formData.append('ProjectName', fileData.projectName);
    formData.append('FileName', fileData.fileName);
    
    if (fileData.outputFileData) {
      formData.append('OutputFileData', fileData.outputFileData);
    }
    if (fileData.notes) {
      formData.append('Notes', fileData.notes);
    }

    return this.http.post(
      `${this.API_URL}/WorkerOn/editoutputfile`,
      formData,
      { 
        headers: new HttpHeaders({
          'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN') || ''}`
        })
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== Projects APIs ====================

  /**
   * GET /api/history/projects
   * Get all unique projects (distinct ProjectNames) for a manager
   */
  getProjects(managerID: number): Observable<{
    projectName: string;
    filesCount: number;
    uploadDate: string;
  }[]> {
    const params = new HttpParams().set('managerID', managerID.toString());
    
    return this.http.get<{
      projectName: string;
      filesCount: number;
      uploadDate: string;
    }[]>(
      `${this.API_URL}/history/projects`,
      { 
        headers: this.getHeaders(),
        params 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== Helper Methods ====================

  /**
   * Format file size to readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if file is an image
   */
  isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return imageExtensions.includes(extension);
  }

  /**
   * Get file extension
   */
  getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  }

  /**
   * Get file icon based on extension
   */
  getFileIcon(filename: string): string {
    const extension = this.getFileExtension(filename);
    
    const iconMap: { [key: string]: string } = {
      'pdf': '📄',
      'doc': '📝', 'docx': '📝',
      'xls': '📊', 'xlsx': '📊',
      'ppt': '📊', 'pptx': '📊',
      'txt': '📋',
      'zip': '🗜️', 'rar': '🗜️',
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
      'mp4': '🎬', 'avi': '🎬',
      'mp3': '🎵', 'wav': '🎵'
    };
    
    return iconMap[extension] || '📁';
  }

  /**
   * Validate file type
   */
  isValidFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = this.getFileExtension(filename);
    return allowedTypes.includes(extension);
  }

  /**
   * Calculate days difference from date
   */
  getDaysDifference(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}