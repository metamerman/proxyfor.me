import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';

import { amGlobalService } from './global.service';
import { amLoginService } from './login.service';
import { amAlertService } from './alert.service';
import { amLogin } from './classes';

@Component({
    selector: 'my-register',
    templateUrl: 'register.component.html',
    styleUrls: ['register.component.css']
})
export class amRegisterComponent implements OnInit {
    li: amLogin = new amLogin;
    active = true;
    liForm: FormGroup;

    formErrors = {
        'screen_name': '',
        'email': '',
        'password': ''
    };

    validationMessages = {
        'screen_name': {
            'required': 'Screen name is required.',
            'exists': 'Screen name already exists'
        },
        'email': {
            'required': 'Email address is required.',
            'exists': 'Email address already used'
         },
        'password': { 'required': 'Password is required.' }
    };
    constructor(
        private fb: FormBuilder,
        private router: Router,
        private globalService: amGlobalService,
        private loginService: amLoginService,
        private alertService: amAlertService) { }

    ngOnInit() {
        this.buildForm();
    }

    onSubmit() {
        this.active = false;
        this.li = this.liForm.value;
        this.loginService.login(this.li)
            .then(n => { this.router.navigate(['/profile']) })
            .catch(e => { this.alertService.error("Registration failed", e) });
        this.active = true;
    }

    doCheck(control: AbstractControl) {
        return new Promise((resolve, reject) => {
            this.loginService.exists(this.li).then(res => {
                if (res.text() === "true")
                    resolve({ "exists": true });
                else
                    resolve(null);
            });
        });
    }

    checkSn(control: AbstractControl) {
        this.li.screen_name = control.value;
        this.li.email = undefined;
        return this.doCheck(control);
    }

    checkEmail(control: AbstractControl) {
        this.li.email = control.value;
        this.li.screen_name = undefined;
        return this.doCheck(control);
    }

    buildForm(): void {
        this.liForm = this.fb.group({
            'screen_name': [this.li.screen_name, Validators.required, this.checkSn.bind(this)],
            'email': [this.li.email, Validators.required, this.checkEmail.bind(this)],
            'password': [this.li.password, Validators.required]
        });
        this.liForm.valueChanges.subscribe(data => this.onValueChanged(data));
        this.onValueChanged(); // (re)set validation messages now
    }

    onValueChanged(data?: any) {
        if (!this.liForm)
            return;
        const form = this.liForm;

        for (const field in this.formErrors) {
            // clear previous error message (if any)
            this.formErrors[field] = '';
            const control = form.get(field);

            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                for (const key in control.errors) {
                    this.formErrors[field] += messages[key] + ' ';
                }
            }
        }
    }

    private handleError(error: any): void {
        this.globalService.handleError('Register component error', error);
    }
}