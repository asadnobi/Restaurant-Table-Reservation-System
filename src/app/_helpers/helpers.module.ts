import { NgModule } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
//pipes
import { MySplitPipe } from 'src/app/_helpers/pipes/split.pipe';
import { CharacterPipe } from 'src/app/_helpers/pipes/character.pipe';
import { ArrayPipe } from 'src/app/_helpers/pipes/array.pipe';
import { EllipsisPipe } from 'src/app/_helpers/pipes/ellipsis.pipe';
import { MyCurrencyPipe } from 'src/app/_helpers/pipes/currency.pipe';
//directives
import { ToggleShowHidePassDirective } from './directives/toggle-show-hide-pass.directive';

@NgModule({
    declarations: [
        //pipes
        MySplitPipe, CharacterPipe, ArrayPipe, EllipsisPipe, MyCurrencyPipe,
        //directives
        ToggleShowHidePassDirective
    ],
    exports: [
        //pipes
        MySplitPipe, CharacterPipe, ArrayPipe, EllipsisPipe, MyCurrencyPipe,
        //directives
        ToggleShowHidePassDirective
    ],
    providers: [CurrencyPipe, CharacterPipe]
})

export class helpersModule {

}