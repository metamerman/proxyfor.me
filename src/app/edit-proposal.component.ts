import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { amGlobalService } from './global.service';
import { amAlertService } from './alert.service';
import { amEditService } from './edit.service';
import { amProposal } from './classes';

@Component({
    selector: 'my-edit-proposal',
    templateUrl: 'edit-proposal.component.html',
    styleUrls: ['edit-proposal.component.css']
})
export class amEditProposalComponent implements OnInit {
    active = true;
    pForm: FormGroup;

    formErrors = {
        'id': '',
        'version': '',
        'title': '',
        'proposer': '',
        'abstract': '',
        'cost': '',
        'effective_date': '',        
        'history': '',
        'justfication': '',
    };

    validationMessages = {
        'id': { 'required': 'ID is required.' },
        'version': { 'required': 'Version is required.' },
        'title': { 'required': 'Title is required.' },
        'proposer': { 'required': 'Proposer is required.' },
        'abstract': { 'required': 'Abstract is required.' },
        'cost': { 'required': 'Cost is required.' },
        'effective_date': { 'required': 'Effective date is required.' },
        'history': { 'required': 'History is required.' },
        'justification': { 'required': 'Justification is required.' },
    };

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
        this.globalService.proposal = this.pForm.value;
        this.editService.putProposal(this.globalService.proposal)
            .then(n => window.history.back())
            .catch(e => this.alertService.error("Put proposal failed", e));
        this.active = true;
    }

    buildForm(): void {
        this.pForm = this.fb.group({
            'id': [this.globalService.proposal.id, Validators.required],
            'version': [this.globalService.proposal.version, Validators.required],
            'title': [this.globalService.proposal.title, Validators.required],
            'proposer': [this.globalService.proposal.proposer, Validators.required],
            'abstract': [this.globalService.proposal.abstract, Validators.required],
            'cost': [this.globalService.proposal.cost, Validators.required],
            'effective_date': [this.globalService.proposal.effective_date, Validators.required],
            'history': [this.globalService.proposal.history, Validators.required],
            'justification': [this.globalService.proposal.justification, Validators.required],
            'full_text': [this.globalService.proposal.full_text],
            'q_a': [this.globalService.proposal.q_a],
            'oe': [this.globalService.proposal.oe]
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

    cancel() {
        window.history.back();
    }

    private handleError(error: any): void {
        this.globalService.handleError('Edit-proposal component error', error);
    }
}