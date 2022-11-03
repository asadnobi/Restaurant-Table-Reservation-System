import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[passShowHide]'
})
export class ToggleShowHidePassDirective {
  private _shown = false;

  constructor(private el: ElementRef) {
  }

  @HostListener('click') onClick() {
    this._shown = !this._shown;
    if (this._shown) {
      this.el.nativeElement.firstChild.firstChild.innerHTML = '<span class="icon-view"></span>'; 
      this.el.nativeElement.previousElementSibling.setAttribute('type', 'text');
    } else {
      this.el.nativeElement.firstChild.firstChild.innerHTML = '<span class="icon-private"></span>';
      this.el.nativeElement.previousElementSibling.setAttribute('type', 'password');
    }
  }

}
