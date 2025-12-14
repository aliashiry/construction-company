import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListPageComponent } from './list/list.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  { path: 'list', component: ListPageComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentsRoutingModule { }
