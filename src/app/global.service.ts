import { Injectable } from '@angular/core'
import { Headers, RequestOptions } from '@angular/http';

import { amProfile, amProposal, amProposalHead, amVote } from './classes';

@Injectable()
export class amGlobalService {
  tokenName: string = "am_token";
  snName: string = "am_sn";
  myProfile: amProfile = new amProfile(undefined);
  myCites: boolean[] = [];
  myVotes: amVote[] = [];
  b5a: string[];
  ia: string[];
  proposalHeads: amProposalHead[];
  proposal: amProposal = new amProposal();
  activeTab: string;

  init() {
    this.myProfile.token = localStorage.getItem(this.tokenName);
    this.myProfile.screen_name = localStorage.getItem(this.snName);
  }

  changeToken(token: string) {
    this.myProfile.token = token;
    if (!token)
      localStorage.removeItem(this.tokenName);
    else
      localStorage.setItem(this.tokenName, this.myProfile.token);
  }

  changeSn(sn: string) {
    this.myProfile.screen_name = sn;
    if (!sn)
      localStorage.removeItem(this.snName);
    else
      localStorage.setItem(this.snName, this.myProfile.screen_name);
  }

  logout() {
    this.changeToken(undefined);
    this.changeSn(undefined);
  }

  makeHeaders() {
    let headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append('Authorization', 'Bearer ' + this.myProfile.token);
    return new RequestOptions({ headers: headers });
  }

  validate(form: any, errors: any, vmessages: any): boolean {
    let valid = true;
    for (const field in errors) {
      errors[field] = '';
      const control = form.get(field);
      if (control && !control.valid) {
        const messages = vmessages[field];
        for (const key in control.errors) {
          errors[field] += messages[key] + ' ';
          valid = false;
        }
      }
    }
    return valid;
  }

  handleError(component: any, error: any): void {
    console.error(component, error);
  }
}