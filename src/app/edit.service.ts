import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { amProposal, amPost } from './classes';
import { amGlobalService } from './global.service';

@Injectable()
export class amEditService {
    constructor(private globalService: amGlobalService,
        private http: Http) { }

    putProposal(p: amProposal) {
        return this.http
            .put("/proposal", JSON.stringify(p), this.globalService.makeHeaders())
            .toPromise()
            .catch(e => { throw(e); });
    }

    putPost(p: amPost) {
        return this.http
            .put("/post", JSON.stringify(p), this.globalService.makeHeaders())
            .toPromise()
            .catch(e => { throw(e); });
    }


    private handleError(error: any): void {
        this.globalService.handleError('Login service error', error);
    }
}
