import { Component, OnInit } from '@angular/core';
import { FileStorage } from '../../interfaces/FileStorage';
import { UploadService } from '../../services/upload.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-upload-file',
  standalone: true,
  imports: [FormsModule, CommonModule ,RouterModule],
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css']
})
export class UploadFileComponent implements OnInit {
  fileStorage: FileStorage = {
    UserID: 123,
    ProjectName: '',
    FileName: '',
    InputFileData: null,
    Notes: ''
  };

  isUploading = false;

  constructor(private uploadService: UploadService) {}
  ngOnInit() {
    const savedData = this.uploadService.getFileStorage();
    if (savedData) {
      this.fileStorage = savedData;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileStorage.InputFileData = input.files[0];
      this.fileStorage.FileName = input.files[0].name;
      this.uploadService.setFileStorage(this.fileStorage);
    }
  }

  removeFile() {
    this.fileStorage.InputFileData = null;
    this.fileStorage.FileName = '';
    this.uploadService.clearFile();
  }

  submitForm() {
    if (!this.fileStorage.InputFileData) return;

    this.isUploading = true;
    this.uploadService.uploadFile(this.fileStorage.InputFileData).subscribe({
      next: (res) => {
        console.log('File uploaded', res);
        this.isUploading = false;
        this.uploadService.setFileStorage(this.fileStorage);
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.isUploading = false;
      }
    });
  }
  onSubmit() 
  {

  }
}
