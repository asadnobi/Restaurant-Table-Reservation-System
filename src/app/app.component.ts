import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
//services
import { HttpService } from 'src/app/services/http.service';
import { LoadingService } from 'src/app/services/loading.service';
import { SharedService } from './services/shared.service';
//reducers
import { selectSchedule } from "../store/selectors/schedule.selector";
import { selectResdata } from "../store/selectors/restaurant.selector";
import { addResData } from '../store/actions/restaurant.actions';
import { addSchedule } from '../store/actions/schedule.actions';
import { Restaurant } from 'src/store/models/restaurant.model';
import { CustomSchedule, Schedule } from 'src/store/models/schedule.model';
import { selectUserdata } from 'src/store/selectors/user.selector';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  public isloading$: Observable<any>;
  public schedule$: Observable<any>;
  public resdata$: Observable<any>;
  public userdata$: Observable<any>;
  public isToastShow$: Observable<any>;
  
  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: any,
    private router: Router,
    public cdr: ChangeDetectorRef,
    private store: Store,
    private httpService: HttpService,
    private loadingService: LoadingService,
    private sharedService: SharedService,
  ) {
    this.isloading$ = this.loadingService.loading$;
    this.isToastShow$ = this.sharedService.isToastShow$;
    this.schedule$ = this.store.select(selectSchedule);
    this.resdata$ = this.store.select(selectResdata);
    this.userdata$ = this.store.select(selectUserdata);
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    //stored session data retrive on window reload
    this.sharedService.storeExistingUser();
    this.sharedService.storeExistingResData();
    this.sharedService.storeExistingSchedule();
    this.sharedService.storeExistingCartData();
    this.sharedService.storeExistingOrder();
    this.sharedService.storeExistingBooking();
    //check restaurant info has or not in store
    this.resdata$.subscribe((val: Restaurant) => {
      if(Object.getOwnPropertyNames(val.restaurant_content).length === 0) {
        this.getRestaurantData();
      }
    });
    //check restaurant schedule has or not in store
    this.schedule$.subscribe((val: Schedule) => {
      if(!val.day_name) this.getRestaurantSchedule();
    });
    if (this.platformId === 'browser') {
      const myToastEl = document.getElementById('myToast');
      if(myToastEl) {
        myToastEl.addEventListener('hide.bs.toast', () => {
          this.sharedService.hideToast();
        });
      }
    }
  }

  private getRestaurantData() {
    this.loadingService.loadingStart();
    const $obs = this.httpService.getRestaurantContent().pipe(map((val: any) => {
      return {
        reservation_deals: val.reservation_deals,
        restaurant_content: val.restaurant_content,
        restaurant_data: val.restaurant_data,
        restaurant_delivery_areas: val.restaurant_delivery_areas,
        restaurant_events: val.restaurant_events,
        restaurant_dish: []
      }
    })).subscribe({
      next: (value: Restaurant) => {
        this.store.dispatch(addResData({payload: value}));
        this.loadingService.loadingClose();
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

  private getRestaurantSchedule() {
    this.loadingService.loadingStart();
    const $obs = this.httpService.getNewSchedule().subscribe({
      next: (value: any) => {
        this.loadingService.loadingClose();
        if(value['status'] && value['data']) {
          const {restaurant_id, _id, __v, ...newObjSchedule} = value['data'];
          let schedule = this.sharedService.getSelectedSchedule(newObjSchedule);
          this.store.dispatch(addSchedule({payload: schedule}));
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

  onActivate(ev: any) {
    this.loadingService.loadingClose();
  }
  onDeactivate(ev: any) {
    this.loadingService.loadingStart();
  }



}
