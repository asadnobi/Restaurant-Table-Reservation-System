import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PhoneNumberUtil } from 'google-libphonenumber';

export function MobileNoCheckValidator(): ValidatorFn {
    return (control: AbstractControl) : ValidationErrors | null => {
        if(!control.value['region'] || !control.value['number']) return null;
        // check number
        if(control.value['number'].length > 1) {
            const phoneUtil = PhoneNumberUtil.getInstance();
            const number = phoneUtil.parseAndKeepRawInput(control.value['number'], control.value['region']);
            let isValid = phoneUtil.isPossibleNumber(number) && phoneUtil.isValidNumber(number);
            return !isValid ? {errorPhone: true} : null;
        } else {
            return {errorPhone: true}
        }
    }
}