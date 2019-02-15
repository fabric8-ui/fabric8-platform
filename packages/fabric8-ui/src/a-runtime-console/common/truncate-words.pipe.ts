import { Pipe } from '@angular/core';

@Pipe({
  name: 'words',
})
export class TruncateWordsPipe {
  transform(value: string, limit: number = 40, trail: String = '…'): string {
    if (!value) {
      return '';
    }

    let result = value;

    if (value) {
      const words = value.split(/\s+/);
      if (words.length > Math.abs(limit)) {
        if (limit < 0) {
          let l = limit;
          l *= -1;
          result = trail + words.slice(words.length - l, words.length).join(' ');
        } else {
          result = words.slice(0, limit).join(' ') + trail;
        }
      }
    }

    return result;
  }
}
