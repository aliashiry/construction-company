import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FileStorage, FileDataFromAPI, FullFileDataResponse } from '../interfaces/FileStorage';
import { API } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private currentFile: File | null = null;
  private currentData: FileStorage | null = null;
  private readonly API_BASE_URL = `${API.BASE_URL}/history`;

  constructor(private http: HttpClient) {
    (window as any).uploadService = this; // For debugging purposes
  }

  setFileStorage(data: FileStorage) {
    this.currentData = data;
    this.currentFile = data.InputFileData;
  }

  getFileStorage(): FileStorage | null {
    return this.currentData ?? null;
  }

  clearFile() {
    this.currentFile = null;
    if (this.currentData) this.currentData.InputFileData = null;
  }

  // -------------------------------------
  // ✅ 1) Send input file to API (/input)
  // -------------------------------------
  submitToInput(fileStorage: FileStorage, forwardUrl?: string): Observable<any> {
    const formData = new FormData();

    if (fileStorage.InputFileData) {
      formData.append('inputFile', fileStorage.InputFileData, fileStorage.InputFileData.name);
    }

    const params = new URLSearchParams({
      userId: fileStorage.UserID.toString(),
      projectName: fileStorage.ProjectName,
      fileName: fileStorage.FileName,
      notes: fileStorage.Notes || '',
      // forwardUrl:`https://hetask15.app.n8n.cloud/webhook/upload-file-dxf`
    });

    return this.http.post(`${this.API_BASE_URL}/input?${params.toString()}`, formData);
  }

  // -------------------------------------
  // ✅ 2) Check for output file existence
  // -------------------------------------
  checkOutput(userId: number, projectName: string, fileName: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('projectName', projectName.trim())
      .set('fileName', fileName.trim());

    return this.http.get(`${this.API_BASE_URL}/output/base64`, { params });
  }

  // -------------------------------------
  // ✅ 3) Fetch output file Base64
  // -------------------------------------
  getOutputFile(userId: number, projectName: string, fileName: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('projectName', projectName.trim())
      .set('fileName', fileName.trim());

    return this.http.get(`${this.API_BASE_URL}/output/base64`, { params });
  }

  // -------------------------------------
  // ✅ NEW: Check output file status
  // -------------------------------------
  checkOutputStatus(userId: number, projectName: string, fileName: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('projectName', projectName.trim())
      .set('fileName', fileName.trim());

    return this.http.get(`${this.API_BASE_URL}/output/status`, { params });
  }

  getOutputFileBase64(userId: number, projectName: string, fileName: string) {
    // تنظيف البيانات
    const cleanProjectName = projectName.trim();
    const cleanFileName = fileName.trim();

    console.log('🔍 getOutputFileBase64 called with:', { 
      userId, 
      cleanProjectName, 
      cleanFileName,
      projectNameIsString: typeof projectName === 'string'
    });

    // تأكد أن جميع البيانات strings
    return this.http.get(
      `${this.API_BASE_URL}/output/base64`,
      {
        params: {
          userId: userId.toString(),
          projectName: cleanProjectName,
          fileName: cleanFileName
        }
    }
    );
  }

  downloadOutputFile(userId: number, projectName: string, fileName: string): Observable<Blob> {
    return this.http.get(`${this.API_BASE_URL}/output/download`, {
      params: { 
        userId: userId.toString(),
        projectName: projectName.trim(),
        fileName: fileName.trim()
      },
      responseType: 'blob'
    });
  }

  downloadAllFiles(userId: number, projectName: string, fileName: string): Observable<Blob> {
    return this.http.get(`${this.API_BASE_URL}/download/all`, {
 params: {
        userId: userId.toString(),
        projectName: projectName.trim(),
 fileName: fileName.trim()
    },
      responseType: 'blob'
    });
  }

  // ============================================
  // ✅ Save edited output file to API
  // ============================================
  saveOutputFile(userId: number, managerId: number, projectName: string, fileName: string, fileBase64: string): Observable<any> {
    // تحويل Base64 لـ Blob
    const byteCharacters = atob(fileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'text/csv' });

    // إنشاء FormData
    const formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('projectName', projectName.trim());
    formData.append('fileName', fileName.trim());
    formData.append('outputFile', blob, fileName);

    console.log('💾 Sending save request to API /history/output:', {
      url: `${this.API_BASE_URL}/output`,
      params: { userId, projectName, fileName },
      blob: blob.type,
      blobSize: blob.size
    });

    return this.http.post(
      `${this.API_BASE_URL}/output`,
      formData
    );
  }


  // في ملف upload.service.ts
// أضف هذه الـ method مع الـ methods الموجودة

/**
 * Get all files for a specific project
 */
getFilesByProject(userId: number, projectName: string): Observable<FileDataFromAPI[]> {
  const params = new HttpParams()
    .set('userId', userId.toString())
    .set('projectName', projectName);
  
  return this.http.get<FileDataFromAPI[]>(`${this.API_BASE_URL}/files/by-project`, { params });
}

  // ============================================
  // ✅ ALT: حفظ باستخدام FormData (إذا كان الـ API يتوقع ذلك)
  // ============================================
  saveOutputFileFormData(userId: number, managerId: number, projectName: string, fileName: string, csvBlob: Blob): Observable<any> {
const formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('managerId', managerId.toString());
    formData.append('projectName', projectName.trim());
    formData.append('fileName', fileName.trim());
    formData.append('outputFile', csvBlob, fileName);

    console.log('💾 Sending FormData save request to API:', {
      url: `${this.API_BASE_URL}/output`,
      params: { userId, managerId, projectName, fileName }
    });

    return this.http.post(
   `${this.API_BASE_URL}/output`,
      formData
    );
  }

  // -------------------------------------
  // ✅ Get full file data history for user
  // -------------------------------------
  getFullFileData(userId: number): Observable<FullFileDataResponse> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<FullFileDataResponse>(`${this.API_BASE_URL}/files/full-data`, { params });
  }

  getFullFileData2(userId: number, projectName: string): Observable<FullFileDataResponse> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('projectName', projectName);
    return this.http.get<FullFileDataResponse>(`${this.API_BASE_URL}/files`, { params });
  }

//   getFullFileData21(userId: number, projectName: string): Observable<any[]> {
//   const params = new HttpParams()
//     .set('userId', userId.toString())
//     .set('projectName', projectName);
//   return this.http.get<any[]>(`${this.API_BASE_URL}/files`, { params });
// }


  // -----------------------------
  // Get all projects for a user
  // -----------------------------
  getAllProjects(userId: number): Observable<string[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<string[]>(`${this.API_BASE_URL}/projects`, { params });
  }

  // -----------------------------
  // Get number of projects for a user
  // -----------------------------
  getProjectsCount(userId: number): Observable<{ ProjectCount: number }> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<{ ProjectCount: number }>(`${this.API_BASE_URL}/projects`, { params });
  }

  // -----------------------------
  // Get number of files for a user's project
  // -----------------------------
  getFilesCountByProject(userId: number, projectName: string): Observable<number> {
    const params = new HttpParams()
      .set('userId', userId.toString());
    return this.http.get<{ projectCount: number }>(`${this.API_BASE_URL}/projects/count`, { params })
      .pipe(
        map(res => res.projectCount)
      );
  }

  // -----------------------------
  // Get total number of files for a user
  // -----------------------------
  getFilesCount(userId: number): Observable<number> {
    const params = new HttpParams().set('userId', userId.toString());

    return this.http.get<{ fileCount: number }>(`${this.API_BASE_URL}/files/totalcount`, { params })
      .pipe(
        map(response => response.fileCount)
      );
  }
}
