import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'array' })

export class ArrayPipe implements PipeTransform {
  transform(array: any[], value: any): Boolean {
    if(!array || array.length <= 0) return false;
    return array.some(item => item['_id'] === value);
  }
}
