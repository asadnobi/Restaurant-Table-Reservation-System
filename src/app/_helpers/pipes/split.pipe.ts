import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'split' })
export class MySplitPipe implements PipeTransform {
  transform(input:string, separator:string=','): string[] {
    if(!input) return [];
    return input.split(separator);
  }
}