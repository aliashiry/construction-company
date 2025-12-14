import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FileStorage, FileDataFromAPI, FullFileDataResponse } from '../models/FileStorage';
import { API } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private currentFile: File | null = null;
  private currentData: FileStorage | null = null;
  private readonly API_BASE_URL = `${API.BASE_URL}/history`;

  constructor(private http: HttpClient) {}

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
      forwardUrl: forwardUrl || 'https://hshama7md15.app.n8n.cloud/webhook/upload-file-dxf'
    });

    return this.http.post(`${this.API_BASE_URL}/input?${params.toString()}`, formData);
  }

  // -------------------------------------
  // ✅ 2) Check for output file existence
  // -------------------------------------
  checkOutput(userId: number, projectName: string, fileName: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('projectName', projectName)
      .set('fileName', fileName);

    return this.http.get(`${this.API_BASE_URL}/output/base64`, { params });
  }

  // -------------------------------------
  // ✅ 3) Fetch output file Base64
  // -------------------------------------
  getOutputFile(userId: number, projectName: string, fileName: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('projectName', projectName)
      .set('fileName', fileName);

    return this.http.get(`${this.API_BASE_URL}/output/base64`, { params });
  }

  // -------------------------------------
  // ✅ NEW: Check output file status
  // -------------------------------------
  checkOutputStatus(userId: number, projectName: string, fileName: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('projectName', projectName)
      .set('fileName', fileName);

    return this.http.get(`${this.API_BASE_URL}/output/status`, { params });
  }

  getOutputFileBase64(userId: number, projectName: string, fileName: string) {
    return this.http.get(
      `${this.API_BASE_URL}/output/base64`,
      { params: { userId, projectName, fileName } }
    );
  }

  downloadOutputFile(userId: number, projectName: string, fileName: string): Observable<Blob> {
    return this.http.get(`${this.API_BASE_URL}/output/download`, {
      params: { userId, projectName, fileName },
      responseType: 'blob'
    });
  }

  

  downloadAllFiles(userId: number, projectName: string, fileName: string): Observable<Blob> {
    return this.http.get(`${this.API_BASE_URL}/download/all`, {
      params: {
        userId: userId.toString(),
        projectName: projectName,
        fileName: fileName
      },
      responseType: 'blob'
    });
  }

  // -------------------------------------
  // ✅ Get full file data history for user
  // -------------------------------------
  getFullFileData(userId: number): Observable<FullFileDataResponse> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<FullFileDataResponse>(`${this.API_BASE_URL}/files/full-data`, { params });
  }

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
    return this.http.get<{ ProjectCount: number }>(`${this.API_BASE_URL}/projects/count`, { params });
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