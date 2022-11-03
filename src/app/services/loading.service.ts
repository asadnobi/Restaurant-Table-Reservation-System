import {Injectable} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LoadingService {
  public loading$ = new BehaviorSubject<boolean>(false);
  constructor() {
  }

  loadingStart() {
    this.loading$.next(true);
  }

  loadingClose() {
    this.loading$.next(false);
  }

}