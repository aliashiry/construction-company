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
    return this.currentData ?? null;
  }

  clearFile() {
    this.currentFile = null;
    if (this.currentData) this.currentData.InputFileData = null;
  }

  // -------------------------------------
  // ✅ 1) إرسال ملف الإدخال إلى API (/input)
  // -------------------------------------
  submitToInput(fileStorage: FileStorage): Observable<any> {
    const formData = new FormData();

    formData.append('userId', fileStorage.UserID.toString());
    formData.append('projectName', fileStorage.ProjectName);
    formData.append('fileName', fileStorage.FileName);
    formData.append('notes', fileStorage.Notes || '');

    if (fileStorage.InputFileData) {
      formData.append('inputFile', fileStorage.InputFileData, fileStorage.InputFileData.name);
    }

    return this.http.post(`${this.API_BASE_URL}/input`, formData);
  }

  // -------------------------------------
  // ✅ 2) التحقق من وجود ملف الإخراج
  // -------------------------------------
  checkOutput(userId: number, projectName: string, fileName: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('projectName', projectName)
      .set('fileName', fileName);

    // تعديل المسار الصحيح: (check-output) بدل (check-ouput)
    return this.http.get(`${this.API_BASE_URL}/output/base64`, { params });
  }

  // -------------------------------------
  // ✅ 3) جلب ملف الإخراج Base64
  // -------------------------------------
  getOutputFile(userId: number, projectName: string, fileName: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('projectName', projectName)
      .set('fileName', fileName);

    return this.http.get(`${this.API_BASE_URL}/output/base64`, { params });
  }
}
