import { AfterViewInit, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { formatDate } from '@angular/common';
import { Router } from '@angular/router';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
declare var $: any;
declare var bootstrap: any;
//validators
import { MobileNoCheckValidator } from 'src/app/_helpers/validators/mobile-no-check.validation';
//services
import { HttpService } from 'src/app/services/http.service';
import { LoadingService } from 'src/app/services/loading.service';
import { SharedService } from 'src/app/services/shared.service';
import { SEOService } from 'src/app/services/seo.service';
//store
import { User } from 'src/store/models/user.model';
import { selectResdata } from 'src/store/selectors/restaurant.selector';
import { selectUserdata } from 'src/store/selectors/user.selector';
import { selectBookingdata } from 'src/store/selectors/booking.selector';
import { Restaurant } from 'src/store/models/restaurant.model';
import { CustomSchedule, Schedule, Time } from 'src/store/models/schedule.model';
import { Booking } from 'src/store/models/booking.model';
import { removeCoupon, updateBookingInitialData, updateBookingPartialData, updateCoupon, updateUser } from 'src/store/actions/booking.actions';

@Component({
  selector: 'app-reservation-process',
  host: {class: 'page-wrapper'},
  templateUrl: './reservation-process.component.html',
  styleUrls: ['./reservation-process.component.scss']
})
export class ReservationProcessComponent implements OnInit, AfterViewInit {
  public resdata$: Observable<any>;
  public userdata$: Observable<any>;
  public bookingdata$: Observable<any>;
  private resdata: Restaurant | null;
  public bookingdata: Booking | null;
  // api data
  public pageContent: any;
  public bookingSetting: any;
  public countryList: any[];
  public preferredCountryList: any[];
  public selectedCountry: any;
  private resSchedule: {customdays: CustomSchedule[], weekdays: Schedule[]} | null;
  private bookedTimeList: any;
  // variables
  public form: FormGroup;
  public bookArray: any;
  private emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  public phase: number;
  public couponCode: string | null;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: any,
    private store: Store,
    private fb: FormBuilder,
    private httpService: HttpService,
    private loadingService: LoadingService,
    private seoService: SEOService,
    private sharedService: SharedService,
    private router: Router
  ) {
    this.resdata$ = this.store.select(selectResdata);
    this.userdata$ = this.store.select(selectUserdata);
    this.bookingdata$ = this.store.select(selectBookingdata);
    this.resdata = null;
    this.bookingdata = null;
    this.resSchedule = null;
    this.form = new FormGroup({});
    this.bookingSetting = null;
    this.countryList = [];
    this.preferredCountryList = [];
    this.selectedCountry = null;
    this.phase = 1;
    this.couponCode = null;
  }

  ngOnInit(): void {
    this.bookingdata$.subscribe((value: Booking) => {
      this.bookingdata = value;
    });
    this.userdata$.subscribe((value: User) => {
      if(value.isLogged && value.data) {
        let bookingUserdata = {
          first_name: value.data.first_name,
          last_name: value.data.last_name,
          phone_no: value.data.phone_no,
          mobile_no: value.data.mobile_no,
          email: value.data.email,
          address: value.data.primary_address,
          _id: value.data._id
        }
        this.store.dispatch(updateUser({ user: bookingUserdata }));
      }
    });
    this.form = this.fb.group({
      reservation_date: [null, Validators.required],
      no_of_guest: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
      reservation_time: [null, Validators.required],
      special_request: null
    });
    this.form.controls['reservation_date'].valueChanges.subscribe(ev => {
      this.form.controls['reservation_time'].setValue(null);
      this.generateSchedule();
      this.getBookedTimeSlotList();
    });
  }

  ngAfterViewInit(): void {
    $('#datepicker').datepicker({format: 'dd-MM-yyy', startDate: '-0d'});
    $('#datepicker').on('changeDate', (ev: any) => {
      this.form.controls['reservation_date'].setValue(new Date(ev.date));
    });
    this.getPageContent();
    this.getBookingSetting().then(() => {
      if(!this.bookingSetting) return;
      if(this.bookingSetting?.is_booking_closed_today) {
        $('#datepicker').datepicker('setStartDate', formatDate(new Date(new Date().setDate((new Date().getDate() + 1))), 'dd-MM-yyy', 'en-us'));
      }
      if(this.bookingSetting?.off_dates && this.bookingSetting?.off_dates.length > 0) {
        $('#datepicker').datepicker('setDatesDisabled', this.bookingSetting.off_dates);
      }
      if(this.bookingdata?.reservation_date) {
        $('#datepicker').datepicker('update', new Date(this.bookingdata?.reservation_date));
        this.form.controls['reservation_date'].setValue(new Date(this.bookingdata?.reservation_date));
      }
      if(this.bookingSetting?.minimum_person) {
        this.form.controls['no_of_guest'].addValidators(Validators.min(this.bookingSetting.minimum_person));
      }
      if(this.bookingSetting?.maximum_person) {
        this.form.controls['no_of_guest'].addValidators(Validators.max(this.bookingSetting.maximum_person));
      }
      const person: number = (
        this.bookingdata?.no_of_guest 
        && (this.bookingSetting.minimum_person && this.bookingdata?.no_of_guest >= this.bookingSetting.minimum_person)
        && (this.bookingSetting.maximum_person && this.bookingdata?.no_of_guest <= this.bookingSetting.maximum_person)
      ) ? this.bookingdata?.no_of_guest : this.bookingSetting.minimum_person;
      if(person && person > 1) this.form.controls['no_of_guest'].setValue(person);
      this.form.updateValueAndValidity();
    });
  }

  private getPageContent() {
    this.loadingService.loadingStart();
    const $obs = this.httpService.getPageDataById_V2(5).subscribe({
      next: (value: any) => {
        this.loadingService.loadingClose();
        this.pageContent = value;
        if (value.seo_page_title && value.seo_page_title !== '') {
          this.seoService.setPageTitle(value.seo_page_title);// set page title
        }
        if (value.seo_meta && value.seo_meta !== '') {
          this.seoService.addMetaTag(value.seo_meta); // meta data
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

  private getBookingSetting() {
    return new Promise<void>((resolve, reject) => {
      this.loadingService.loadingStart();
      const $obs = this.httpService.getbookingSetting().subscribe({
        next: (value: any) => {
          this.loadingService.loadingClose();
          if(value['status'] && value['data']) {
            this.bookingSetting = {
              ...value['data'], 
              off_dates: value['data']?.off_dates.map((date: string) => formatDate(date, 'dd-MM-yyy', 'en-us'))
            }
          }
          resolve();
        },
        error: (err: Error) => {
          this.loadingService.loadingClose();
          reject();
        },
        complete: () => {
          $obs.unsubscribe();
          this.loadingService.loadingClose();
        }   
      });
    });
  }

  private getBookedTimeSlotList() {
    if(!this.form.value['reservation_date']) return;
    this.loadingService.loadingStart();
    this.bookedTimeList = null;
    const $obs = this.httpService.bookedTimeSlotList(this.form.value['reservation_date']).subscribe({
      next: (value: any) => {
        this.loadingService.loadingClose();
        if(value['status'] && value['data']) {
          this.bookedTimeList = value['data'];
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

  public submitReservation() {
    console.log(this.form)
    this.form.markAllAsTouched();
    if(this.form.invalid) return;
    this.phase = this.phase + 1;
    if(this.phase == 2 && this.bookingdata?.user) {
      this.store.dispatch(updateBookingInitialData(this.form.value));
      this.setUserForm();
    }
    let partialData: any = {notes: this.form.value.special_request};
    if (!this.bookingSetting?.is_booking_deposit) {
      partialData = {...partialData, payment_status: true, payment_type: "CASH", grand_total: 0};
    } else {
      if (this.bookingSetting?.deposit_type == 'per_booking') {
        partialData = {...partialData, payment_status: false, payment_type: "CARD", grand_total: Number(Number(this.bookingSetting.deposit_amount).toFixed(2))};
      } else if (this.bookingSetting.deposit_type == 'per_guest') {
        if (this.form.value.no_of_guest >= this.bookingSetting.deposit_minimum_guest) {
          partialData = {...partialData, payment_status: false, payment_type: "CARD", grand_total: Number(Number(this.bookingSetting.deposit_amount * this.form.value.no_of_guest).toFixed(2))};
        } else {
          partialData = {...partialData, payment_status: true, payment_type: "CASH", grand_total: 0};
        }
      }
    }
    this.store.dispatch(updateBookingPartialData(partialData));
    console.log(this.bookingdata)
    return false;
    this.loadingService.loadingStart();
    const $obs = this.httpService.reservationService(this.bookingdata).subscribe({
      next: (value: any) => {
        this.loadingService.loadingClose();
        if (value['body'] && value['body'].status === 'success') {
          let data = value['body'].data;
          if (data['payment_status'] === true) {
            this.trackBooking(data);
          }
          if (data['payment_status'] === false && data['payment_type'] === 'CARD') {
            this.router.navigate(['/payment', data['booking_id'], 'reservation']);
          }
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

  private trackBooking(bookingInfo: any) {
    if (bookingInfo['status'] === 'Pending') {
      this.router.navigate(['/user-booking-track', bookingInfo['booking_id']]);
    } else if (bookingInfo['status'] === 'Accepted') {
      this.router.navigate(['/reservation-details', bookingInfo['booking_id']]);
    }
  }

  private setUserForm() {
    // mobile check
    this.countryList = this.sharedService.getCountryList()?.all;
    this.preferredCountryList = this.sharedService.getCountryList()?.preferred;
    this.selectedCountry = this.sharedService.getCountryList()?.default;
    //set user form
    const userForm = this.fb.group({
      first_name: [(this.bookingdata?.user?.first_name ? this.bookingdata?.user?.first_name : null), [Validators.required, Validators.maxLength(34)]],
      last_name: [(this.bookingdata?.user?.last_name ? this.bookingdata?.user?.last_name : null), [Validators.required, Validators.maxLength(34)]],
      email: [(this.bookingdata?.user?.email ? this.bookingdata?.user?.email : null), [Validators.required, Validators.email, Validators.pattern(this.emailRegex)]],
      mobile: this.fb.group({
        region: [this.selectedCountry.region, Validators.required],
        number: [(this.bookingdata?.user?.mobile_no ? this.bookingdata?.user?.mobile_no : null), Validators.required]
      })
    });
    userForm.controls['mobile'].addValidators(MobileNoCheckValidator());
    this.form.addControl('user', userForm);
    this.form.addControl('terms_and_condition', this.fb.control(true, Validators.requiredTrue));
    if(this.phase < 3 && this.form.valid) this.phase = 3;
  }
  private removeUserForm() {
    if(this.form.get('user')) {
      this.form.removeControl('user');
      this.form.removeControl('terms_and_condition');
    }
  }


  public increaseGuest() {
    this.form.controls['no_of_guest'].setValue(this.form.controls['no_of_guest'].value + 1);
    if(this.form.controls['no_of_guest'].errors) {
      let max = this.form.controls['no_of_guest'].errors['max']?.max;
      if(!max) return;
      this.form.controls['no_of_guest'].setValue(max);
      this.sharedService.showToast('Opps!', `Please select maximum ${max} guest.`);
    }
  }
  public decreaseGuest() {
    if(this.form.controls['no_of_guest'].value <= 1) return;
    this.form.controls['no_of_guest'].setValue(this.form.controls['no_of_guest'].value - 1);
    if(this.form.controls['no_of_guest'].errors) {
      let min = this.form.controls['no_of_guest'].errors['min']?.min;
      if(!min) return;
      this.form.controls['no_of_guest'].setValue(min);
      this.sharedService.showToast('Opps!', `Please select minimum ${min} guest.`);
    }
  }

  public selectTime(time: any) {
    this.form.controls['reservation_time'].setValue(null);
    this.form.controls['no_of_guest'].setValue(1);
    this.form.controls['no_of_guest'].setValidators([Validators.min(1), Validators.max(50)]);
    this.phase = 1;
    if(
      this.bookedTimeList 
      && Object.keys(this.bookedTimeList).some((key) => key == time.time) 
      && this.bookedTimeList[time.time] >= time.max_bookings_per_time_slot 
    ) {
      this.sharedService.showToast('Opps!', 'Please select another time, We are fully booked on this slot.');
      if(this.phase > 1) this.phase = 1;
      return;
    }
    this.form.controls['reservation_time'].setValue(time.time);
    if(time.minimum_person) this.form.controls['no_of_guest'].setValue(time.minimum_person);
    if(time.minimum_person) this.form.controls['no_of_guest'].addValidators(Validators.min(time.minimum_person));
    if(time.maximum_person) this.form.controls['no_of_guest'].addValidators(Validators.max(time.maximum_person));
  }

  public loginOptions(method: string) {
    if (method === 'devoret') {
      this.router.navigateByUrl('/sign-in');
    } else if (method === 'google') {
      // this.loginService.loginWithGoogle();
    } else if (method === 'facebook') {
      // this.loginService.loginWithFacebook();
    } else if (method === 'guest') {
      this.setUserForm();
    }
  }

  

  
  private getRestaurantSchedule() {
    return new Promise<any>((resolve, reject) => {
      this.loadingService.loadingStart();
      const $obs = this.httpService.getNewSchedule().subscribe({
        next: (value: any) => {
          this.loadingService.loadingClose();
          if(value['status'] && value['data']) {
            const {restaurant_id, _id, __v, ...newObjSchedule} = value['data'];
            this.resSchedule = newObjSchedule;
          }
          resolve(this.resSchedule);
        },
        error: (err: Error) => {
          this.loadingService.loadingClose();
          reject();
        },
        complete: () => {
          $obs.unsubscribe();
          this.loadingService.loadingClose(); 
        }      
      });
    });
  }

  private async generateSchedule() {
    if(!this.form.value['reservation_date']) return;
    this.phase = 1;
    this.removeUserForm();
    let selectedDateschedule: Schedule | null = null;
    if(this.resSchedule) {
      selectedDateschedule = await this.sharedService.getSelectedSchedule(this.resSchedule, this.form.value['reservation_date']);
    } else {
      await this.getRestaurantSchedule().then((newObjSchedule) => {
        selectedDateschedule = this.sharedService.getSelectedSchedule(newObjSchedule, this.form.value['reservation_date']);
      });
    }
    if(selectedDateschedule) this.generateTime(selectedDateschedule);
  }

  private generateTime(schedule: Schedule) {
    let advancebookingTime: number = 0;
    if(this.bookingSetting && this.bookingSetting.minimum_time_distance) {
      advancebookingTime = Number(this.bookingSetting.minimum_time_distance * 60);
    }
    let _bookArray: any[] = [];
    if(!schedule.is_active) return;
    schedule.times.forEach((time: Time) => {
      if(!time.is_active) return;
      if(
        time.booking.is_active 
        && !time.booking.is_booked 
        && !time.booking.is_disable 
        && this.sharedService.checkTime(time.time, advancebookingTime, this.form.value['reservation_date'])
      ) {
        _bookArray.push({...time.booking, time: time.time});
        if(this.bookingdata?.reservation_time == time.time) {
          this.form.controls['reservation_time'].setValue(this.bookingdata?.reservation_time);
        }
      }
    });
    this.bookArray = _bookArray.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / 12);
      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [] // start a new chunk
      }
      resultArray[chunkIndex].push(item)
      return resultArray
    }, []);
  }

   /*--------coupon start------------*/ 
  private applyCoupon(data: any) {
    this.loadingService.loadingStart();
    const $obs = this.httpService.applyPromoCode(data).subscribe({
      next: (value: any) => {
        this.loadingService.loadingClose();
        if(value.status) {
          this.store.dispatch(updateCoupon({ coupon: value['data'] }));
        } else {
          this.sharedService.showToast('Opps!', 'Invalid Code. Please try again with vaild coupon code.');
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
  public validateCoupon() {
    if(!this.couponCode || this.couponCode.length < 6) {
      this.sharedService.showToast('Opps!', 'Please enter your 6 digit code');
      return;
    }
    if (!this.bookingdata?.user) {
      this.sharedService.showToast('Opps!', 'Please login first with valid user credential, then try again');
      return;
    }
    let CODE = this.couponCode.charAt(0) !== '#' ? '#'.concat(this.couponCode) : this.couponCode;
    const applyCouponData = {
      code: CODE,
      reservation_date: this.form.value.reservation_date,
      no_of_guest: this.form.value.no_of_guest,
      reservation_time: this.form.value.reservation_time,
      first_name: this.form.value.user.first_name,
      last_name: this.form.value.user.last_name,
      email: this.form.value.user.email,
      mobile: this.sharedService.formatMobileNumber(this.form.value.user.mobile.region, this.form.value.user.mobile.number),
      userId: this.bookingdata.user._id
    }
    this.applyCoupon(applyCouponData);
  }
  public removeCoupon() {
    this.store.dispatch(removeCoupon());
  }
  




}
