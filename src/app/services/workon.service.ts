import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class WorkOnService {
  private base = `${API.BASE_URL}/WorkerOn`;

  constructor(private http: HttpClient) {}

  getManagersForWorker(projectName: string, userId: number): Observable<any> {
    const params = new HttpParams().set('userid', userId.toString());
    return this.http.get<any>(`${this.base}/manager/${encodeURIComponent(projectName)}`, { params });
  }

  /**
   * Edit output file - saves the edited CSV back to the server
   * POST /api/WorkerOn/editoutputfile
   * Expects FormData with:
   * - userId (number)
   * - ManagerID (number) 
   * - ProjectName (string)
   * - FileName (string)
   * - OutputFile (Blob - the CSV file)
   */
  editOutputFile(fileData: {
    userId: number;
    managerID: number;
    projectName: string;
    fileName: string;
    outputFileData?: Blob;
  }): Observable<any> {
    const fd = new FormData();
    
    // Clean and validate data
    const userId = fileData.userId;
    const managerId = fileData.managerID;
    const projectName = fileData.projectName.trim();
    const fileName = fileData.fileName.trim();

    console.log('📤 editOutputFile called with:', { userId, managerId, projectName, fileName });

    fd.append('UserId', userId.toString());
    fd.append('ManagerID', managerId.toString());
    fd.append('ProjectName', projectName);
    fd.append('FileName', fileName);
    
    if (fileData.outputFileData) {
      fd.append('OutputFile', fileData.outputFileData, `${fileName}_output.csv`);
      console.log('📦 File appended to FormData');
    }

    return this.http.post(`${this.base}/editoutputfile`, fd);
  }
}
