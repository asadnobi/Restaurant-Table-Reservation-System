import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { ReservationProcessComponent } from './reservation-process.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { helpersModule } from 'src/app/_helpers/helpers.module';

const routes: Routes = [
  { path: '', component: ReservationProcessComponent }
]

@NgModule({
  declarations: [ReservationProcessComponent],
  imports: [
    CommonModule, RouterModule.forChild(routes),
    FormsModule, ReactiveFormsModule,
    helpersModule
  ]
})
export class ReservationProcessModule { }
