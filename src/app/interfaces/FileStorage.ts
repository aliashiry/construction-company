export interface FileStorage {
  UserID: number;
  ProjectName: string;
  FileName: string;
  InputFileData: File | null;
  Notes: string;
  dateCreate?: string;
}
export interface FileDataFromAPI {
  projectName: string;
  fileName: string;
  notes: string;
  dateCreate?: string;
}

export interface FullFileDataResponse {
  fullFileData: FileDataFromAPI[];
}