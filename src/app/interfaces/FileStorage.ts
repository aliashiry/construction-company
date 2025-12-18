export interface FileStorage {
  UserID: number;
  ProjectName: string;
  FileName: string;
  InputFileData: File | null;
  Notes: string;
  dateCreate?: string;
}
// export interface FileDataFromAPI {
//   projectName: string;
//   fileName: string;
//   notes: string;
//   dateCreate?: string;
// }

export interface FullFileDataResponse {
  fullFileData: FileDataFromAPI[];
}

export interface ProjectData {
  projectName: string;
  filesCount: number;
  uploadDate: string;
  managerID: number;
  notes?: string;
}

export interface WorkerData {
  userId: number;
  userName: string;
  managerID: number;
  projectName: string;
  assignedDate: string;
  role?: string;
}

export interface AddWorkerRequest {
  userId: number;
  userName: string;
  managerID: number;
  projectName: string;
  role?: string;
}

export interface FileData {
  id: string;
  filename: string;
  projectName: string;
  uploadedAt: string;
  filePath: string;
  userId: string;
}

export interface Project {
  id: string;
  projectName: string;
  description?: string;
  createdAt: string;
  userId: string;
}


// FileStorage.ts - Complete Interfaces

/**
 * FileStorage entity interface
 * Represents a file in the system with manager and project information
//  */
// export interface FileStorage {
//   UserID: number;           // ManagerID (FK → User.UserID)
//   ProjectName: string;      // Part of composite PK
//   FileName: string;         // Part of composite PK
//   InputFileData?: File;     // File to upload
//   OutputFileData?: Blob;    // Processed file data
//   Notes?: string;           // Optional notes
//   UploadDate?: string;      // Upload date (ISO string)
// }

/**
 * File data returned from API
 */
export interface FileDataFromAPI {
  managerID: number;
  projectName: string;
  fileName: string;
  dateCreate?: string;
  notes?: string;
  outputFileData?: string;  // Base64 or URL
  fileSize?: number;
  email?: string;           // Manager email
}

/**
 * Full file data response from API
 */
export interface FullFileDataResponse {
  fullFileData: FileDataFromAPI[];
  totalCount?: number;
}

/**
 * Project data interface
 */
export interface ProjectData {
  projectName: string;
  filesCount: number;
  uploadDate: string;
  managerID: number;
  notes?: string;
  workersCount?: number;    // Number of workers assigned
}

/**
 * Project from API
 */
export interface Project {
  projectName: string;
  filesCount: number;
  uploadDate: string;
}

/**
 * Worker data interface
 */
export interface WorkerData {
  userId: number;
  userName: string;
  email?: string;           // Worker email
  managerID: number;
  projectName: string;
  role?: string;
  assignedDate: string;
}

/**
 * Add worker request (old version - by userId)
 */
export interface AddWorkerRequest {
  userId: number;
  userName: string;
  managerID: number;
  projectName: string;
  role?: string;
}

/**
 * Add worker by email request (new version)
 */
export interface AddWorkerByEmailRequest {
  email: string;
  managerID: number;
  projectName: string;
  role?: string;
}

/**
 * Remove worker request
 */
export interface RemoveWorkerRequest {
  workerEmail?: string;     // New: remove by email
  userId?: number;          // Old: remove by userId
  managerID: number;
  projectName: string;
}

/**
 * Manager information
 */
export interface ManagerInfo {
  managerID: number;
  managerName: string;
  email?: string;
}

/**
 * File data interface (old version)
 */
export interface FileData {
  fileName: string;
  projectName: string;
  uploadDate: string;
  notes?: string;
}

/**
 * Worker's assigned files
 */
export interface WorkerAssignedFile {
  managerID: number;
  managerName: string;
  projectName: string;
  fileName: string;
  uploadDate: string;
  notes?: string;
}

/**
 * Edit output file request
 */
export interface EditOutputFileRequest {
  userId: number;
  managerID: number;
  projectName: string;
  fileName: string;
  outputFileData?: Blob;
  notes?: string;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  success: boolean;
  message: string;
  fileName?: string;
  projectName?: string;
  uploadDate?: string;
}

/**
 * File status response
 */
export interface FileStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

/**
 * Statistics response
 */
export interface StatisticsResponse {
  projectsCount: number;
  filesCount: number;
  workersCount: number;
  storageUsed?: number;
}