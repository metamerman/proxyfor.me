import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { amGlobalService } from './global.service';
import { amAlertService } from './alert.service';
import { amEditService } from './edit.service';
import { amProposal } from './classes';

@Component({
    selector: 'my-edit-proposal',
    templateUrl: 'edit-q-a.component.html',
    styleUrls: ['edit-q-a.component.css']
})
export class amEditQAComponent implements OnInit {
    active = true;
    pForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private globalService: amGlobalService,
        private editService: amEditService,
        private alertService: amAlertService) { }

    ngOnInit() {
        this.buildForm();
    }

    onSubmit() {
        this.active = false;
        this.globalService.proposal.q_a = this.pForm.value.q_a;
        this.editService.putProposal(this.globalService.proposal)
            .then(n => window.history.back())
            .catch(e => this.alertService.error("Put Q & A failed", e));
        this.active = true;
    }

    buildForm(): void {
        this.pForm = this.fb.group({
            'q_a': [this.globalService.proposal.q_a]
        });
    }

    cancel() {
        window.history.back();
    }

    private handleError(error: any): void {
        this.globalService.handleError('Edit-proposal component error', error);
    }
}