import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FileStorage } from '../interfaces/FileStorage';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private currentFile: File | null = null;
  private currentData: FileStorage | null = null;

  constructor(private http: HttpClient) {}

  setFileStorage(data: FileStorage) {
    this.currentData = data;
    this.currentFile = data.InputFileData;
  }

  getFileStorage(): FileStorage | null {
    if (this.currentData) return this.currentData;
    return null;
  }

  getCurrentFile(): File | null {
    return this.currentFile;
  }

  clearFile() {
    this.currentFile = null;
    if (this.currentData) this.currentData.InputFileData = null;
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post('https://hshama7md15.app.n8n.cloud/webhook-test/upload-file-dxf', formData);
  }
}
