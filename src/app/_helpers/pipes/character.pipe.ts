import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'char' })

export class CharacterPipe implements PipeTransform {
  transform(value: string): string {
    if(!value) return value;
    return (value.replace(/[^a-zA-Z0-9]/ig, '').toLowerCase()).trim();
  }
}
