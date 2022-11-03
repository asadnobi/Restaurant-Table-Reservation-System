import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PreloadRouter } from './services/preload-router.service';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  { path: 'sign-in', loadChildren: () => import('./pages/auth/sign-in/sign-in.module').then(m => m.SignInModule) },
  { path: 'sign-up', loadChildren: () => import('./pages/auth/sign-up/sign-up.module').then(m => m.SignUpModule) },
  { path: 'forget-password', loadChildren: () => import('./pages/auth/forget-password/forget-password.module').then(m => m.ForgetPasswordModule) },
  { path: 'reset-password', loadChildren: () => import('./pages/auth/forget-password/forget-password.module').then(m => m.ForgetPasswordModule) },

  { path: 'reservation', loadChildren: () => import('./pages/reservation/reservation-process/reservation-process.module').then(m => m.ReservationProcessModule) },
  { path: 'reservation-details/:booking_id', loadChildren: () => import('./pages/reservation/reservation-details/reservation-details.module').then(m => m.ReservationDetailsModule) },
  
  // preloading module
  { 
    path: 'error-page', loadChildren: () => import('./pages/others/error-page/error-page.module').then(m => m.ErrorPageModule),
    data: {preload: true, loadAfterSeconds: 5} 
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: PreloadRouter
    }),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }