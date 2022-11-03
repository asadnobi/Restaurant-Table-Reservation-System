import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationProcessComponent } from './reservation-process.component';

describe('ReservationProcessComponent', () => {
  let component: ReservationProcessComponent;
  let fixture: ComponentFixture<ReservationProcessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReservationProcessComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
