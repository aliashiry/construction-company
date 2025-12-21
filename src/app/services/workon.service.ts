import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../constants/app.constants';
import { WorkerData, FileDataFromAPI } from '../interfaces/FileStorage';

@Injectable({ providedIn: 'root' })
export class WorkOnService {
  private readonly API_URL = `${API.BASE_URL}/workeron`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('AUTH_TOKEN') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * GET /api/workeron/workers?managerId={id}
   * كل العمال المسندين للمدير
   */
  getWorkersForManager(managerId: number): Observable<any> {
    const params = new HttpParams().set('managerId', managerId.toString());
    return this.http.get<any>(
      `${this.API_URL}/workers`,
      { headers: this.getHeaders(), params }
    );
  }

  /**
   * GET /api/workeron?userId={id}
   * كل المشاريع والملفات المسندة للعامل تحت جميع المديرين
   */
  getWorkerProjects(userId: number): Observable<any> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<any>(
      `${this.API_URL}`,
      { headers: this.getHeaders(), params }
    );
  }

  /**
   * GET /api/workeron/assign/MyFiles/{userId}
   * الملفات المسندة للعامل من مشاريع لا يديرها
   */
  getWorkerAssignedFiles(userId: number): Observable<FileDataFromAPI[]> {
    return this.http.get<FileDataFromAPI[]>(
      `${this.API_URL}/assign/MyFiles/${userId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /api/workeron/manager/{projectName}?userid={id}
   * معلومات المديرين للمشروع
   */
  getProjectManagers(projectName: string, userId: number): Observable<any[]> {
    const params = new HttpParams().set('userid', userId.toString());
    return this.http.get<any[]>(
      `${this.API_URL}/manager/${encodeURIComponent(projectName)}`,
      { headers: this.getHeaders(), params }
    );
  }

  /**
   * POST /api/workeron/addworker
   * إضافة عامل للمشروع
   */
  addWorkerByEmail(data: {
    useremail: string;
    managerId: number;
    projectName: string;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.API_URL}/addworker`,
      data,
      { headers: this.getHeaders() }
    );
  }

  /**
   * DELETE /api/workeron/rmworker
   * إزالة عامل من المشروع
   */
  removeWorkerByEmail(data: {
    workerEmail: string;
    managerId: number;
    projectName: string;
  }): Observable<any> {
    return this.http.delete<any>(
      `${this.API_URL}/rmworker`,
      { 
        headers: this.getHeaders(),
        body: data
      }
    );
  }

  /**
   * POST /api/workeron/editoutputfile
   * تحديث ملف الإخراج
   */
  editOutputFile(data: {
    managerId: number;
    projectName: string;
    fileName: string;
    outputFile: Blob;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('managerId', data.managerId.toString());
    formData.append('projectName', data.projectName);
    formData.append('fileName', data.fileName);
    formData.append('outputFile', data.outputFile);

    return this.http.post<any>(
      `${this.API_URL}/editoutputfile`,
      formData,
      { 
        headers: new HttpHeaders({
          'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN') || ''}`
        })
      }
    );
  }
}
