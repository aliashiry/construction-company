import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () => import('./pages/list/list.component').then(m => m.ListPageComponent)
  },
  {
    path: 'upload',
    loadComponent: () => import('./pages/upload/upload.component').then(m => m.UploadPageComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'upload-data',
    loadComponent: () => import('./components/upload-file/upload-file.component').then(m => m.UploadFileComponent)
  }
];

