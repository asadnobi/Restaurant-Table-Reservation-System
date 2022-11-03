import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams, HttpRequest} from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Store } from '@ngrx/store';
import { lastValueFrom, map, take } from 'rxjs';
import { environment } from 'src/environments/environment';
import { selectUserdata } from 'src/store/selectors/user.selector';
import { Address } from 'src/store/models/user.model';

export interface country {
  country: string;
  code: string;
  region: string;
}

@Injectable()
export class HttpService {
  private API = environment.API;
  private API2 = environment.API2;
  private RESTAURANT_ID: string | null;
  private RESTAURANT_NAME: string | null;
  private USERTOKEN!: string | null;

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private store: Store,
  ) {
    this.store.select(selectUserdata).subscribe(res => {
      this.USERTOKEN = res.token;
    })
    this.RESTAURANT_ID = this.cookieService.check('resID') ? this.cookieService.get('resID') : null;
    this.RESTAURANT_NAME = this.cookieService.check('resName') ? this.cookieService.get('resName') : null;
  }

  public countryList() {
    return this.http.get<any>(environment.urlCountryList);
  }

  public async getRegionByCountry(countryName: string) { 
    const source$ = this.countryList().pipe(map(list => {
      const matchdata = list.filter((item: any) => item.country.toLowerCase() == countryName.toLowerCase());
      return matchdata && matchdata.length > 0 ? matchdata[0] : null;
    })).pipe(take(1));
    return await lastValueFrom(source$);
  }

  public getRestaurantContent() {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    let url = this.API + 'getRestaurantContent/' + this.RESTAURANT_ID;
    return this.http.get<Object>(url, {headers});
  }

  public getNewSchedule() {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    const url = this.API2 + 'admin/getNewOneSchedule?restaurant_id='+ this.RESTAURANT_ID;
    return this.http.get<any>(url, {headers});
  }

  public getMenu() {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    let url = this.API + 'getMenu/' + this.RESTAURANT_ID;
    return this.http.get<Object>(url, {headers});
  }

  public getPageDataById_V2(pageId: Number) {
    let url = this.API + 'getPageDataById_V2/' + this.RESTAURANT_ID + '/' + pageId;
    return this.http.get<Object>(url);
  }

  public getRestaurantReviews() {
    let url = this.API2 + 'getReviews/' + this.RESTAURANT_ID;
    return this.http.get<{data: Object, status: String}>(url);
  }

  public getGroupDishData(ids: string[]) {
    const data = {'ids': ids};
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    const url = this.API2 + 'getGroupDishByIds';
    return this.http.post<any>(url, data, {headers});
  }

  public loginService(body: {}) {
    const url = this.API2 + 'loginAuth';
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post(url, body, {headers: headers});
  }

  public getUserOrders(user_id: string) {
    const url = this.API2 + 'auth/customer_orders/' + user_id + '/' + this.RESTAURANT_ID;
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('X-Access-Token', 'Bearer ' + this.USERTOKEN);
    return this.http.get(url, {headers});
  }

  public getGetPaymentMethod() {
    let url = this.API2 + 'getPaymentMethod/' + this.RESTAURANT_ID;
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.get<any>(url, {headers});
  }

  public applyPromoCode(payload: any) {
    payload['restaurant_id'] = this.RESTAURANT_ID;
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('X-Access-Token', 'Bearer ' + this.USERTOKEN);
    const url = this.API2 + 'auth/userApplyPromoCode';
    return this.http.post(url, payload, {headers});
  }

  public postOrder(data: any) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('X-Access-Token', 'Bearer ' + this.USERTOKEN);
    data.restaurant_id = this.RESTAURANT_ID;
    const url = this.API2 + 'auth/saveOrder';
    return this.http.post(url, data, {headers});
  }

  public checkExistUser(data: any) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    const url = this.API2 + 'checkUserExistence';
    return this.http.post(url, data, {headers});
  }

  public retriveAddressListByPostcode(postcode: string) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    const url = this.API2 + 'findWithPostcode/' + postcode;
    return this.http.get(url, {headers: headers}).pipe(map((result: any) => {
      if(!result['addresses'] || result['addresses'].length <= 0) return [];
      let addrList: Address[] = result['addresses'].map((address: any) => {
        let format_address2 = '';
        if (address.line_2) format_address2 = format_address2.concat(address.line_2);
        if (address.line_3) format_address2 = format_address2.concat(', ' + address.line_3);
        if (address.locality) format_address2 = format_address2.concat(', ' + address.locality);
        let addr: Address = {
          address1: address.line_1,
          address2: format_address2.replace(/^,/, '').trim(),
          town_or_city: address.town_or_city,
          postcode: result.postcode,
          country: address.country
        }
        return addr;
      });
      return addrList;
    }));
  }

  public sendForgotOtp(mobileNo: string) {
    const url = this.API2 + 'sendForgotPassOtp';
    return this.http.post(url, {mobile_no: mobileNo});
  }

  public verifyForgetPasswordToken(data: any) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    const url = this.API2 + 'verify_forget_password';
    return this.http.post(url, data, {headers});
  }

  public registrationService(body: any) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    body.registered_restaurant_id = this.RESTAURANT_ID;
    const url = this.API2 + 'registration';
    return this.http.post(url, body, {headers});
  }

  public getbookingSetting() {
    let params = new HttpParams();
    if(this.RESTAURANT_ID) params = params.set('restaurant_id', this.RESTAURANT_ID);
    const url = this.API2 + 'admin/admin_getBookingInfo';
    return this.http.get(url, {params});
  }

  public bookedTimeSlotList(date: string | Date) {
    const url = this.API2 + 'getBookedTimeSlotList';
    let params = new HttpParams();
    params = params.set('booking_date', new Date(date).toDateString());
    if(this.RESTAURANT_ID) params = params.set('rid', this.RESTAURANT_ID);
    return this.http.get<any>(url, {params});
  }

  public reservationService(data: any) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    const url = this.API2 + 'restaurant_reservations/create';
    const body = {...data, restaurant_id: this.RESTAURANT_ID, restaurant_name: this.RESTAURANT_NAME};
    return this.http.post(url, body, {headers});
  }

  public getOrderDetails(order_id: string) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('X-Access-Token', 'Bearer ' + this.USERTOKEN);
    const url = this.API2 + 'auth/getOrderDetails/' + order_id;
    return this.http.get(url, {headers});
  }

  public trackOrder(order_id: string) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('X-Access-Token', 'Bearer ' + this.USERTOKEN);
    const url = this.API2 + 'auth/trackOrder/' + order_id;
    return this.http.get(url, {headers});
  }

  public getBookingDetails(booking_id: string) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    let params = new HttpParams();
    params = params.set('booking_id', booking_id);
    const url = this.API2 + 'getBookingByBookingId';
    return this.http.get(url, {params, headers});
  }

  public createStripePaymentIntent(payload: any) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    let url = 'api/create-payment-intent';
    return this.http.post(url, payload, {headers});
  }

  public retrieveStripePaymentIntent(paymentIntent: string) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    let url = 'api/retrieve-payment-intent/' + paymentIntent;
    return this.http.get(url, {headers});
  }

  public getStripeCustomerList(payload: any) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    let url = 'api/get-stripe-customer-list';
    return this.http.post(url, payload, {headers});
  }

  public createStripeCustomer(payload: any) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    let url = 'api/create-stripe-customer';
    return this.http.post(url, payload, {headers});
  }

  public updateStripeOrderPaymentStatus(body: string, order_id: string) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('X-Access-Token', 'Bearer ' + this.USERTOKEN);
    let params = new HttpParams();
    params = params.set('_id', order_id);
    const url = this.API2 + 'auth/updateStripePaymentStatus';
    return this.http.post(url, body, {headers, params});
  }

  public updateStripeBookingPaymentStatus(body: string, booking_id: string) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    let params = new HttpParams();
    params = params.set('_id', booking_id);
    const url = this.API2 + 'updateStripeBookingPaymentStatus';
    return this.http.post(url, body, {headers, params});
  }

  public getUserActivity(userId: string) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('X-Access-Token', 'Bearer ' + this.USERTOKEN);
    const url = this.API2 + 'auth/user/activity/' + userId + '/' + this.RESTAURANT_ID;
    return this.http.get(url, {headers});
  }

  public getUserReservation(userId: string) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('X-Access-Token', 'Bearer ' + this.USERTOKEN);
    const url = this.API2 + 'auth/getReservations/' + userId + '/' + this.RESTAURANT_ID;
    return this.http.get(url, {headers});
  }

  public getReOrderData(orderId: string) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('X-Access-Token', 'Bearer ' + this.USERTOKEN);
    let params = new HttpParams();
    params = params.set('_id', orderId);
    const url = this.API2 + 'getReOrderData';
    return this.http.get(url, {headers});
  }

  public updateUserInfo(data: any) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers = headers.set('X-Access-Token', 'Bearer ' + this.USERTOKEN);
    const url = this.API2 + 'auth/user/update';
    return this.http.put(url, data, {headers: headers});
  }

  
}


