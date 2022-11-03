import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

// custom validator to check that two fields match
export function MustMatch(): ValidatorFn {
    return (control: AbstractControl) : ValidationErrors | null => {
        const sourceCtrl = control.get('password');
        const targetCtrl = control.get('confirmPassword');
        // console.log(sourceCtrl?.value)
        if (sourceCtrl?.value && targetCtrl?.value) {
            if(sourceCtrl.value !== targetCtrl.value) {
                targetCtrl.setErrors({passwordMatchError: true});
            }
            return null;
        }
        return null;
    }
}