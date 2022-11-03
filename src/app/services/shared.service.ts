import {Injectable, Inject, PLATFORM_ID} from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, map } from 'rxjs';
import { Md5 } from 'ts-md5';
import { environment } from 'src/environments/environment';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';
import { CookieService } from 'ngx-cookie-service';
//store
import { retrieveResData } from 'src/store/actions/restaurant.actions';
import { retrieveSchedule } from 'src/store/actions/schedule.actions';
import { retrieveCart, clearCart } from 'src/store/actions/cart.actions';
import { retrieveOrder } from 'src/store/actions/order.actions';
import { clearUser, retrieveUser } from 'src/store/actions/user.actions';
import { User, Userdata } from 'src/store/models/user.model';
import { selectResdata } from 'src/store/selectors/restaurant.selector';
import { Restaurant } from 'src/store/models/restaurant.model';
import { selectOrderdata } from 'src/store/selectors/order.selector';
import { Order, Promo } from 'src/store/models/order.model';
import { selectUserdata } from 'src/store/selectors/user.selector';
import { CustomSchedule, Schedule } from 'src/store/models/schedule.model';
import { retrieveBooking } from 'src/store/actions/booking.actions';

export interface HashKey {
  _id: string;
  dish_id: string;
  dish_name: string;
  dish_instruction: string;
  combination: any[];
  group: any[];
  package: any[];
}

@Injectable()
export class SharedService {
  public isToastShow$ = new BehaviorSubject<any>(false);
  public modalData$ = new BehaviorSubject<any>(null);
  public routeData$ = new BehaviorSubject<any>(null);
  private restaurantPromo: Promo[] = [];
  private orderdata!: Order;
  private userdata!: Userdata | null;
  private restaurantData: any;
  private restaurantDish: any;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: any,
    private store: Store,
    private cookieService: CookieService
  ) {
    this.store.select(selectResdata).subscribe((value: Restaurant) => {
      this.restaurantData = value.restaurant_data;
      this.restaurantDish = value.restaurant_dish;
    });    
    this.store.select(selectOrderdata).subscribe((value: Order) => {
      this.orderdata = value;
    }); 
    this.store.select(selectUserdata).subscribe((value: User) => {
      this.userdata = value.data;
    });
  }

  public storeExistingUser() {
    if (this.platformId === 'browser') {
      const userData = localStorage.getItem('user-data');
      const userToken = this.cookieService.get('token');
      if (!userData || !userToken) return;
      const payload: User = JSON.parse(userData);
      if(payload.token === userToken) {
        this.store.dispatch(retrieveUser({payload: payload}));
      } else {
        this.store.dispatch(clearUser());
        this.cookieService.delete('token');
      }
    }
  }

  public storeExistingResData() {
    if (this.platformId === 'browser') {
      const resData = sessionStorage.getItem('res-data');
      if (!resData) return;
      const data = JSON.parse(resData);
      this.store.dispatch(retrieveResData({payload: data}));
    }
  }

  public storeExistingSchedule() {
    if (this.platformId === 'browser') {
      const resData = sessionStorage.getItem('schedule');
      if (!resData) return;
      const data = JSON.parse(resData);
      this.store.dispatch(retrieveSchedule({payload: data}));
    }
  }

  public storeExistingOrder() {
    if (this.platformId === 'browser') {
      const orderData = sessionStorage.getItem('order');
      if (!orderData) return;
      const data = JSON.parse(orderData);
      this.store.dispatch(retrieveOrder({payload: data}));
    }
  }

  public storeExistingCartData() {
    if (this.platformId === 'browser') {
      const cart = localStorage.getItem('cart-data');
      const cartTracker = localStorage.getItem('cart-tracker');
      if ((cart && !cartTracker) || (!cart && cartTracker)) {
        this.store.dispatch(clearCart());
        return;
      }
      if(cart && cartTracker) {
        let cartHashString: string | null = this.createCartTracker(JSON.parse(cart));
        let trackerHashString: string | null = JSON.parse(cartTracker);
        if(cartHashString !== trackerHashString) {
          this.store.dispatch(clearCart());
          return;
        }
        this.store.dispatch(retrieveCart({payload: JSON.parse(cart)}));
      }
    }
  }

  public createCartTracker(data: any): string | null {
    //genarate hash
    let stringifyData = JSON.stringify(data);
    const secret = environment.SITE_SECRET_KEY;
    const md5 = new Md5();
    let genarateHashString = md5.appendStr(stringifyData).appendStr(secret).end();
    if(typeof(genarateHashString) === 'string') {
      return genarateHashString;
    }
    return null;
  }

  public generateDishHashKey(hashKeyObject: HashKey): string | null {
    let combinationString: string = '';
    let groupString: string = '';
    if (hashKeyObject['combination'] && hashKeyObject['combination'].length > 0) {
      hashKeyObject['combination'].forEach((comb:any, i:number) => {
        combinationString = combinationString.concat(comb['_id']);
        comb['options'].forEach((opt:any, j:number) => {
          combinationString = combinationString.concat(opt['_id']);
          if(opt.isSelected) combinationString = combinationString.concat(i.toString()).concat(j.toString()).concat(opt.selectedQty);
        });
      });
    }
    if (hashKeyObject['group'] && hashKeyObject['group'].length > 0) {
      hashKeyObject['group'].forEach((grp:any, i:number) => {
        groupString = groupString.concat(grp['_id']);
        grp['options'].forEach((opt:any, j:number) => {
          groupString = groupString.concat(opt['_id']);
          if(opt.isSelected) groupString = groupString.concat(i.toString()).concat(j.toString()).concat(opt.selectedQty);
        });
      });
    }
    let hashKeyObjectMapping: object = {
      ...hashKeyObject,
      dish_instruction: hashKeyObject.dish_instruction.trim().toLowerCase(),
      combination: combinationString,
      group: groupString
    };
    return this.createCartTracker(hashKeyObjectMapping);
  }

  public storeExistingBooking() {
    if (this.platformId === 'browser') {
      const bookingData = sessionStorage.getItem('booking');
      if (!bookingData) return;
      const data = JSON.parse(bookingData);
      this.store.dispatch(retrieveBooking({payload: data}));
    }
  }

  /*-------------Start Toast----------------*/
  public showToast(title: string, msg: string) {
    this.isToastShow$.next({title: title, msg: msg});
  }
  
  public hideToast() {
    if(this.isToastShow$.value) {
      this.isToastShow$.next(false);
    }
  }
  /*-------------End Toast----------------*/


  public getTownCity(address: any) {
    let town_or_city = '';
    if (address.town_or_city) {
      town_or_city = address.town_or_city;
    } else {
      if (address.town) town_or_city = town_or_city.concat(address.town);
      if (address.city) town_or_city = town_or_city.concat(', ' + address.city);
      town_or_city = town_or_city.replace(/^,/, '').trim();
    }
    return town_or_city;
  }













  /*-------------common functions----------------*/
  public checkTime(time: string, policyTime: number, date?: string | Date): boolean {
    const formatDate = date ? (this.isToday(date) ? new Date() : new Date(date)) : new Date();
    const startFrom: number =  Number(this.getMinutesStartTime(formatDate) + policyTime);
    const matchTime: number = this.getMinutes24h(this.convertTime12to24(time));
    return (startFrom < matchTime) ? true : false;
  }
  private getMinutesStartTime(date: string | Date): number {
    var formatDate = new Date(date);
    let time = Number(Number(formatDate.getHours() * 60) + formatDate.getMinutes());
    return time;
  }
  private convertTime24to12 = (time24: any) => {
    const [sHours, minutes] = time24.match(/([0-9]{1,2}):([0-9]{2})/).slice(1);
    const period = +sHours < 12 ? 'AM' : 'PM';
    const hours = +sHours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
  }
  private convertTime12to24 = (time12: any) => {
    const [sHours, minutes, period] = time12.match(/([0-9]{1,2}):([0-9]{2}) (AM|PM)/).slice(1);
    const PM = period === 'PM';
    const hours = (+sHours % 12) + (PM ? 12 : 0);
    return `${('0' + hours).slice(-2)}:${minutes}`;
  }
  private getMinutes24h(time24h: string): number {
    const time: string[] = time24h.split(':');
    return Number(Number(Number(time[0]) * 60) + Number(time[1]));
  }

  private isToday(date: string | Date): boolean {
    let getDate = new Date(date).toDateString();
    let todayDate = new Date().toDateString();
    return getDate == todayDate;
  }

  public calculateDishVat(dishData: any, discountData: any, totalDish: number) {
    if(!totalDish || totalDish <= 0) return;
    // check vat is enable or not
    if(!this.restaurantData || !this.restaurantData['is_vat_enable']) return;
    // check has discout or not
    // discount amount deduction from dish vat
    let deductedAmount: number = 0;
    if(discountData['amount'] && discountData['amount'] > 0) {
      if(discountData['type'] === 1) {// dish vat deduction by percentage
        deductedAmount = Number(((dishData['unit_price'] * discountData['rate']) / 100).toFixed(4));
      } else {// dish vat deduction by fixed
        deductedAmount = discountData['amount'] / totalDish;
      }
    }
    // declare the property
    let price: number = Number( (((dishData['unit_price'] - deductedAmount)) - dishData['package_price']) * dishData['quantity'] );
    let vatType: string = this.restaurantData.is_vat_included ? 'include' : 'exclude';
    let vatRate: number = dishData['vat_rate'] ? dishData['vat_rate'] : this.findUpperLabelVatRate(dishData['category_id']);
    // vat formula
    let includeFormula = Number(((price / ((100 + vatRate) / 100)) * (vatRate / 100)).toFixed(4));
    let excludeFormula = Number(((price * vatRate) / 100).toFixed(4));
    let vatableAmount: number = vatType === 'include' ? Number(includeFormula.toFixed(4)) : Number(excludeFormula.toFixed(4));
    return {vat_amount: vatableAmount, vat_type: vatType, vat_rate: vatRate};
  }

  private findUpperLabelVatRate(categoryId: string): number {
    let vat_rate: number = 0;
    const dishCategory = this.restaurantDish.flatMap((cuisine: any) => cuisine.dish_categories).find((category: any) => category._id === categoryId);
    if(dishCategory && dishCategory.vat_rate) {
      return vat_rate = dishCategory.vat_rate;
    } else if(this.restaurantData.vat_rate) {
      return vat_rate = this.restaurantData.vat_rate;
    }
    return vat_rate;
  }



  public getAvailablePromotions() {
    return new Promise<any>((resolve, reject) => {
      let selectedpolicy = this.orderdata.policy?.takeaway === 'collection' ? 1 : this.orderdata.policy?.takeaway === 'delivery' ? 2 : null;
      let selectedPaymentMethod = this.orderdata.payment === 'CASH' ? 1 : this.orderdata.payment === 'CARD' ? 2 : null;
      let eligiblePromotionList = this.restaurantPromo.filter((promo: Promo) => 
        // check eligible status
        promo.is_active 
        // check eligible start date
        && (promo.start_date ? new Date(promo.start_date) <= new Date() : true)
        // check eligible end date
        && (promo.end_date ? new Date(promo.end_date) >= new Date() : true)
        // check eligible weekdays
        && (promo.available_days.length > 0 ? promo.available_days.some(f => f=== new Date().getDay()) : true)
        // check eligible device
        && (promo.platform === 0 || promo.platform === 1 || promo.platform === 4 || promo.platform === 5)
        // check eligible takeaway policy
        && (selectedpolicy ? (promo.eligible_for === 0 || promo.eligible_for === selectedpolicy) : true)
        // check eligible takeaway payment
        && (selectedPaymentMethod ? (promo.eligible_payment_methods === 0 || promo.eligible_payment_methods === selectedPaymentMethod) : true)
        // check eligible takeaway amount
        && ((this.orderdata.subTotal && promo.eligible_amount) ? (this.orderdata.subTotal >= promo.eligible_amount) : true)
        // check eligible user
        && (promo.is_first_order ? (this.userdata && this.userdata?.total_orders  > 0 ? false : true) : true)
      );
      resolve(eligiblePromotionList);
    });
  }

  public getCountryList() {
    const phoneUtil = PhoneNumberUtil.getInstance();
    const SupportedRegions = phoneUtil.getSupportedRegions();
    let selectedCountry: any;
    let preferredCountryList: {code: number, region: string}[] = [];
    let countryList: {code: number, region: string}[] = SupportedRegions.map((val: string) => {
      let code = phoneUtil.getCountryCodeForRegion(val);
      const obj = {code: code, region: val};
      if(val == 'BD' || val == 'GB' || val == 'US' || val == 'IN') {
        preferredCountryList.push(obj);
      }
      if(val == 'GB') selectedCountry = obj;
      return obj;
    });
    return {all: countryList, preferred: preferredCountryList, default: selectedCountry};
  }

  public formatMobileNumber(region: string, number: string) {
    const phoneUtil = PhoneNumberUtil.getInstance();
    const mobileNo = phoneUtil.parseAndKeepRawInput(number, region);
    return phoneUtil.format(mobileNo, PhoneNumberFormat.INTERNATIONAL);
  }

  public isValidMobileNumber(mobileNo: string, region: string) {
    const phoneUtil = PhoneNumberUtil.getInstance();
    const number = phoneUtil.parseAndKeepRawInput(mobileNo, region);
    return (phoneUtil.isPossibleNumber(number) && phoneUtil.isValidNumber(number));
  }

  public numberInfo(mobileNo: string, region?: string) {
    if(!mobileNo) return;
    if(mobileNo.charAt(0) !== '+' && !region) return;
    const phoneUtil = PhoneNumberUtil.getInstance();
    const number = phoneUtil.parseAndKeepRawInput(mobileNo, (region ? region : ''));
    return {
      region: phoneUtil.getRegionCodeForNumber(number),
      code: number.getCountryCode(),
      nationalNumber: number.getNationalNumber(),
      internationalNumber: phoneUtil.format(number, PhoneNumberFormat.INTERNATIONAL)
    }
  }

  public formatAddress(addressObj: any) {
    if(!addressObj) return;
    const addressObject = {
      address1: addressObj['address1'],
      address2: addressObj['address2'],
      city: addressObj['city'],
      town_or_city: addressObj['town_or_city'],
      postcode: addressObj['postcode']
    };
    const addr: string[] = Object.values(addressObject);
    let full_address = addr.join(', ').trim().replace(/ ,+/g,'');
    return full_address;
  }

  private getArrayOfObjectToFieldValue(ArrayOfObject: any[], field: string): number[] {
    var output: number[] = [];
    for (var i=0; i < ArrayOfObject.length ; ++i) {
      output.push( Number(ArrayOfObject[i][field]) );
    };
    return output;
  }

  public getSelectedSchedule(schedule: {customdays: CustomSchedule[], weekdays: Schedule[]}, selectedDate?: string | Date): Schedule {
    const dayIndex = selectedDate ? new Date(new Date(selectedDate)).getDay() : new Date().getDay();
    let _schedule: Schedule = schedule.weekdays[dayIndex];
    if(schedule.customdays.length > 0) {
      const matchSchedule = schedule.customdays.filter((obj: CustomSchedule) => {
        if(obj.is_active) {
          let objDate = new Date(obj.date);
          let objDateString = new Date(objDate.getFullYear(), objDate.getMonth(), objDate.getDate()).getTime();
          let matchDate = selectedDate ? new Date(selectedDate) : new Date();
          let matchDateString = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate()).getTime();
          return (objDateString === matchDateString);
        }
        return;
      });
      if(matchSchedule.length > 0) {
        let dayName: string = new Date(matchSchedule[0].date).toLocaleString('en-us', {weekday:'long'});
        const {date, ...newObj} = matchSchedule[0];
        _schedule = {...newObj, day_name: dayName};        
      }
    }
    return _schedule;
  }



}