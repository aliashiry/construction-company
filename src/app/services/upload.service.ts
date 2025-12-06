import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FileStorage } from '../interfaces/FileStorage';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private currentFile: File | null = null;
  private currentData: FileStorage | null = null;
  private readonly API_BASE_URL = 'http://mepboq.runasp.net/api/history';

  constructor(private http: HttpClient) {}

  setFileStorage(data: FileStorage) {
    this.currentData = data;
    this.currentFile = data.InputFileData;
  }

  getFileStorage(): FileStorage | null {
    if (this.currentData) return this.currentData;
    return null;
  }

  clearFile() {
    this.currentFile = null;
    if (this.currentData) this.currentData.InputFileData = null;
  }

  submitToInput(fileStorage: FileStorage): Observable<any> {
    const formData = new FormData();
    
    // إضافة الحقول كما يتوقعها الـ API
    formData.append('userId', fileStorage.UserID.toString());
    formData.append('projectName', fileStorage.ProjectName);
    formData.append('fileName', fileStorage.FileName);
    formData.append('notes', fileStorage.Notes || '');
    
    // إضافة الملف
    if (fileStorage.InputFileData) {
      formData.append('inputFile', fileStorage.InputFileData, fileStorage.InputFileData.name);
    }
    
    return this.http.post(`${this.API_BASE_URL}/input`, formData);
  }

  checkOutput(userId: number, projectName: string, fileName: string): Observable<any> {
    let params = new HttpParams();
    params = params.set('userId', userId.toString());
    params = params.set('projectName', projectName);
    params = params.set('fileName', fileName);
    
    return this.http.get(`${this.API_BASE_URL}/check-ouput`, { params });
  }

  getOutputFile(userId: number, projectName: string, fileName: string): Observable<any> {
  let params = new HttpParams();
    params = params.set('userId', userId.toString());
    params = params.set('projectName', projectName);
    params = params.set('fileName', fileName);
    
    return this.http.get(`${this.API_BASE_URL}/output/base64`, { params });
  }
}
