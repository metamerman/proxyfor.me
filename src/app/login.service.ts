import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { amLogin } from './classes';
import { amGlobalService } from './global.service';

@Injectable()
export class amLoginService {
    constructor(private globalService: amGlobalService,
        private http: Http) { }

    exists(li: amLogin) {
        return this.http.post("/exists", JSON.stringify(li), this.globalService.makeHeaders()).toPromise();
    }

    login(li: amLogin) {
        return this.http
            .post("/login", JSON.stringify(li), this.globalService.makeHeaders())
            .toPromise()
            .then(res => {
                this.globalService.changeToken(res.text());
                this.globalService.changeSn(li.screen_name);
            })
            .catch(e => { throw(e); });
    }

    private handleError(error: any): void {
        this.globalService.handleError('Login service error', error);
    }
}
