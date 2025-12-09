import { Routes } from '@angular/router';

export const routes: Routes = [
  // {
  //   path: '',
  //   loadComponent: () => import('./app.component').then(m => m.AppComponent)
  //   },
  {
    path: 'list',
    loadComponent: () => import('./pages/list/list.component').then(m => m.ListPageComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services.component').then(m => m.ServicesComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
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

