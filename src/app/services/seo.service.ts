import {Injectable} from '@angular/core';
import {Title, Meta} from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SEOService {

    constructor(
      private titleService: Title,
      private meta: Meta
    ) {

    }

    addMetaTag(seoData: any) {
      seoData.map((data: any) => {
        if (data.meta_type === 'default_meta') {
          this.meta.addTag({name: data.name, content: data.content});
        }
        if (data.meta_type === 'og') {
          this.meta.addTag({property: 'og:' + data.name, content: data.content});
        }
        if (data.meta_type === 'twitter') {
          this.meta.addTag({property: 'twitter:' + data.name, content: data.content});
        }
        if (data.meta_type === 'geo') {
          this.meta.addTag({property: 'geo.' + data.name, content: data.content});
        }
        if (data.meta_type === 'place') {
          this.meta.addTag({property: 'place:' + data.name, content: data.content});
        }
        if (data.meta_type === 'restaurant') {
          this.meta.addTag({property: 'restaurant:' + data.name, content: data.content});
        }
      });
    }

    setPageTitle(pageTitle: any) {
      this.titleService.setTitle(pageTitle);
    }
}
