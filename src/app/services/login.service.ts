import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Location } from '@angular/common';
import { JwtHelperService } from "@auth0/angular-jwt";
import { CookieService } from 'ngx-cookie-service';
declare var bootstrap: any;
// services
import { HttpService } from './http.service';
import { LoadingService } from './loading.service';
import { SharedService } from './shared.service';
//store
import { addUser, clearUser } from 'src/store/actions/user.actions';
import { User, Userdata } from 'src/store/models/user.model';

@Injectable()
export class LoginService {
  timer!: number;
  uId!: string;

  constructor(
    private router: Router,
    private httpService: HttpService,
    private sharedService: SharedService,
    private loadingService: LoadingService,
    private cookieService: CookieService,
    private store: Store,
    private location: Location
  ) {

  }

  public updateUser(data: any) {
    this.loadingService.loadingStart();
    const $obs = this.httpService.updateUserInfo(data).subscribe({
      next: (value: any) => {
        this.loadingService.loadingClose();
        if(value['status'] === 'sms_sent') {
          this.sharedService.modalData$.next({mobile_no: data.mobile_no, email: data.email, uid: value.uid});
          this.openOTPModal();
        }
      },
      error: (err: Error) => {
        this.loadingService.loadingClose();
      },
      complete: () => {
        $obs.unsubscribe();
        this.loadingService.loadingClose();
      }   
    });
  }

  public resisterUser(data: any) {
    this.loadingService.loadingStart();
    const $obs = this.httpService.registrationService(data).subscribe({
      next: (value: any) => {
        this.loadingService.loadingClose();
        if(value['status'] === 'sms_sent') {
          this.sharedService.modalData$.next({mobile_no: data.mobile_no, email: data.email, uid: value.uid});
          this.openOTPModal();
        }
      },
      error: (err: Error) => {
        this.loadingService.loadingClose();
      },
      complete: () => {
        $obs.unsubscribe();
        this.loadingService.loadingClose(); 
      }      
    });
  }


  public emailOrMobileLogin(data: any) {
    this.loadingService.loadingStart();
    const $obs = this.httpService.loginService(data).subscribe({
      next: (value: any) => {
        this.loadingService.loadingClose();
        if(value.status === 'success' && value.token) {
          const data = {
            ...value['data'], 
            primary_address: {
              ...value['data'].primary_address,
              town_or_city: this.sharedService.getTownCity(value['data'].primary_address)
            }, 
            user_type: 'normal_user'
          };
          const user: User = {isLogged: true, token: value.token, data: data};
          this.setLoginInfo(user);
        }
      },
      error: (err: Error) => {
        this.loadingService.loadingClose();
      },
      complete: () => {
        $obs.unsubscribe();
        this.loadingService.loadingClose(); 
      }      
    });
  }

  public logout() {
    this.store.dispatch(clearUser());
    this.cookieService.delete('token');
    this.location.replaceState('/');
    this.router.navigateByUrl('/');
  }

  public setLoginInfo(user: User, route?: string) {
    this.store.dispatch(addUser( {payload: user} ));
    /*----set token in cookie-----------*/
    const helper = new JwtHelperService();
    if(!user.token) return;
    const expirationDate = helper.getTokenExpirationDate(user.token);
    if(!expirationDate) return;
    this.cookieService.set('token', user.token, new Date(expirationDate), '/');

    if(user.data?.isVerified) {
      this.location.replaceState('/');
      this.router.navigateByUrl('/' + (route ? route : 'my-account'));
    } else {
      if(user.data?.mobile_no) this.sendOTP(user.data?.mobile_no);
    }
  }

  public sendOTP(mobile_no: string) {
    this.loadingService.loadingStart();
    const $obs = this.httpService.sendForgotOtp(mobile_no).subscribe({
      next: (value: any) => {
        this.loadingService.loadingClose();
        if(value['status'] === 'sms_sent') {
          this.sharedService.modalData$.next({mobile_no: mobile_no, uid: value.uid});
          this.openOTPModal();
        }
      },
      error: (err: Error) => {
        this.loadingService.loadingClose();
      },
      complete: () => {
        $obs.unsubscribe();
        this.loadingService.loadingClose();
      }   
    });
  }

  private openOTPModal() {
    const otpModalEl = document.getElementById('otpModal');
    new bootstrap.Modal(otpModalEl).show();    
  }

  

}
