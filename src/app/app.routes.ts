import { Routes } from '@angular/router';

export const routes: Routes = [
  // {
  //   path: '',
  //   loadComponent: () => import('./app.component').then(m => m.AppComponent)
  //   },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'students',
    loadChildren: () => import('./features/students/students.module').then(m => m.StudentsModule)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services.component').then(m => m.ServicesComponent)
  },
  {
    path: 'upload',
    loadComponent: () => import('./components/upload-file/upload-file.component').then(m => m.UploadFileComponent)
  },
  {
    path: 'file-result',
    loadComponent: () => import('./components/file-result/file-result.component').then(m => m.FileResultComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./components/history/history.component').then(m => m.HistoryComponent)
  },
  {
    path: 'error',
    loadComponent: () => import('./pages/notfound/notfound.component').then(m => m.NotfoundComponent)
  },
  // {
  //   path: '**',
  //   redirectTo: 'error',
  //   pathMatch: 'full'
  // }
];

