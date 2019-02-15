import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Provides access to the parent link which works across
 * lazy loaded multi-hierarchy routing modules whereas '../' can often fail
 */
@Injectable()
export class ParentLinkFactory {
  parentLink: string;

  constructor(router: Router) {
    let urlPrefix = router.url;
    if (urlPrefix) {
      const idx = urlPrefix.lastIndexOf('/');
      if (idx > 0) {
        urlPrefix = urlPrefix.substring(0, idx + 1);
      } else {
        urlPrefix = '../';
      }
    }
    this.parentLink = urlPrefix;
  }
}
