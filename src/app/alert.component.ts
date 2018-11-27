import { Component, OnInit } from '@angular/core';

import { amAlertService } from './alert.service';

@Component({
    selector: 'alert',
    templateUrl: 'alert.component.html'
})

export class amAlertComponent {
    message: any;

    constructor(private alertService: amAlertService) { }

    ngOnInit() {
        this.alertService.getMessage().subscribe(message => { this.message = message; });
    }
}