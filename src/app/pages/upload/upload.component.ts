import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadCenterComponent } from '../../components/upload-center/upload-center.component';

@Component({
  selector: 'app-upload-page',
  standalone: true,
  imports: [CommonModule, UploadCenterComponent],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadPageComponent {
  selectedFile: File | null = null;

  onFileSelected(file: File) {
    this.selectedFile = file;
    console.log('File selected:', file.name);
  }
}

