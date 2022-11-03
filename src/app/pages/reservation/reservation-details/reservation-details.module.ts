import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { helpersModule } from 'src/app/_helpers/helpers.module';

import { ReservationDetailsComponent } from './reservation-details.component';

const routes: Routes = [
  { path: '', component: ReservationDetailsComponent }
]

@NgModule({
  declarations: [ReservationDetailsComponent],
  imports: [
    CommonModule, RouterModule.forChild(routes),
    LazyLoadImageModule,
    helpersModule
  ]
})
export class ReservationDetailsModule { }
