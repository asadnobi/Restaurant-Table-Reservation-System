import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ellipsis' })

export class EllipsisPipe implements PipeTransform {
  transform(val:string, args:number): string {
    if (!val) return '';
    if (!args) return val;
    if (val.length > args) {
      return val.substring(0, args) + '...';
    } else {
      return val;
    }
  }
}