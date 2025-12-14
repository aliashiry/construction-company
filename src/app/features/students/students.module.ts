import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentsRoutingModule } from './students-routing.module';
import { ListPageComponent } from './list/list.component';
import { ProfileComponent } from './profile/profile.component';
import { SharedModule } from '../../shared/shared.module';
import { ListModeComponent } from '../../components/list-mode/list-mode.component';

@NgModule({
  declarations: [ListPageComponent, ProfileComponent],
  imports: [
    CommonModule,
    StudentsRoutingModule,
    SharedModule,
    ListModeComponent
  ]
})
export class StudentsModule { }
