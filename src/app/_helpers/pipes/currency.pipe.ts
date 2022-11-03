import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Pipe({ name: 'myCurrency' })

export class MyCurrencyPipe implements PipeTransform {

  constructor( private currencyPipe: CurrencyPipe ) { }
  
  transform(value: any = 0, currency: string = 'GBP') {
    return this.currencyPipe.transform(
      value,
      currency,
      (currency === 'BDT' ? 'symbol-narrow' : 'symbol'),
      (currency === 'BDT' ? '1.0-0' : '1.2-2')
    );
  }

}
