import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sort' })

export class ArraySortPipe implements PipeTransform {
  transform(array: any[], field: string) {
    if (!Array.isArray(array)) return array;
    return array.sort((x, y) => {
      return x[field] - y[field];
    }); 
  }
}

