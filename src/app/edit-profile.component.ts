import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { amGlobalService } from './global.service';
import { amAlertService } from './alert.service';
import { amProfileService } from './profile.service';
import { amLoginService } from './login.service';
import { amUpdateProfile, amLogin } from './classes';

@Component({
    selector: 'my-edit-profile',
    templateUrl: 'edit-profile.component.html',
    styleUrls: ['edit-profile.component.css']
})
export class amEditProfileComponent implements OnInit {
    active = true;
    nopost = false;
    screen_name: string;
    password: string;
    pForm: FormGroup;

    formErrors = {
        'screen_name': '',
    };

    validationMessages = {
        'screen_name': { 'required': 'Screen name is required.' }
    };

    constructor(
        private fb: FormBuilder,
        private globalService: amGlobalService,
        private profileService: amProfileService,
        private loginService: amLoginService,
        private alertService: amAlertService) { }

    ngOnInit() {
        this.buildForm();
    }

    onSubmit() {
        this.active = false;
        let p: amUpdateProfile = new amUpdateProfile();
        p.screen_name = this.pForm.value.screen_name;
        p.newpw = this.pForm.value.password;
        if (this.nopost)
            p.status = 'n';
        this.profileService.updateProfile(p)
            .then(n => window.history.back())
            .catch(e => this.alertService.error("Update profile failed", e));
        this.active = true;
    }

    buildForm(): void {
        this.pForm = this.fb.group({
            'screen_name': [this.screen_name, Validators.required],
            'password': [this.password],
        });
        this.pForm.valueChanges
            .subscribe(data => this.onValueChanged(data));
        this.onValueChanged(); // (re)set validation messages now
    }

    onValueChanged(data?: any) {
        if (!this.pForm)
            return;
        const form = this.pForm;

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

    login() {
        this.active = false;
        let li: amLogin = new amLogin;
        li.screen_name = this.pForm.value.screen_name;
        this.loginService.login(li)
            .then(n => window.history.back())
            .catch(e => this.alertService.error("Log in failed", e));
        this.active = true;
    }

    delete() {
        this.active = false;
        this.profileService.delete(this.pForm.value.screen_name)
            .then(n => this.alertService.success("Delete profile done!"))
            .catch(e => this.alertService.error("Delete profile failed", e));
        this.active = true;
    }

    cancel() {
        window.history.back();
    }

    private handleError(error: any): void {
        this.globalService.handleError('Edit-proposal component error', error);
    }
}