import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { amGlobalService } from './global.service';
import { amLoginService } from './login.service';
import { amAlertService } from './alert.service';
import { amLogin } from './classes';

@Component({
    selector: 'my-login',
    templateUrl: 'login.component.html',
    styleUrls: ['login.component.css']
})
export class amLoginComponent implements OnInit {
    li: amLogin = new amLogin;
    active = true;
    liForm: FormGroup;
    showPassword = true;

    formErrors = {
        'screen_name': '',
        'password': ''
    };

    validationMessages = {
        'screen_name': { 'required': 'Name is required.' },
        'password': { 'required': 'Password is required.' }
    };

    constructor(
        private fb: FormBuilder,
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
            .then(() => window.history.back())
            .catch(e => this.alertService.error("Log in failed", e));
        this.active = true;
    }

    buildForm(): void {
        this.liForm = this.fb.group({
            'screen_name': [this.li.screen_name, [Validators.required]],
            'password': [this.li.password, Validators.required]
        });
        this.liForm.valueChanges
            .subscribe(data => this.onValueChanged(data));
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
        this.globalService.handleError('Profile component error', error);
    }
}