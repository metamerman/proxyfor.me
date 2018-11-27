import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { amProposalHead, amProposal, amProxyMatch, amVote, amPost, amCite } from './classes';
import { amGlobalService } from './global.service';

@Injectable()
export class amProposalService {
  constructor(private globalService: amGlobalService,
    private http: Http) { }

  getHeads(): Promise<void | amProposalHead[]> {
    return this.http
      .get("heads")
      .toPromise()
      .then(response => response.json() as amProposalHead[])
      .catch(e => this.handleError(e));
  }

  getProposal(which: string): Promise<void | amProposal> {
    return this.http
      .get(which, this.globalService.makeHeaders())
      .toPromise()
      .then(response => response.json() as amProposal)
      .catch(e => this.handleError(e));
  }

  getMatches(which: string): Promise<amProxyMatch[]> {
    return this.http
      .get(which, this.globalService.makeHeaders())
      .toPromise()
      .then(response => response.json())
      .catch(e => this.handleError(e));
  }

  flag(p: amPost): Promise<void> {
    return this.http
      .post("flag", JSON.stringify(p), this.globalService.makeHeaders())
      .toPromise()
      .then(res => {
        if (res.text())
          throw res;
      })
      .catch(e => { throw e });
  }

  vote(vote: amVote): Promise<void> {
    return this.http
      .post("vote", JSON.stringify(vote), this.globalService.makeHeaders())
      .toPromise()
      .then(res => {
        if (res.text())
          throw (res);
      })
      .catch(e => { throw e });
  }

  post(p: amPost): Promise<void> {
    return this.http
      .post("post", JSON.stringify(p), this.globalService.makeHeaders())
      .toPromise()
      .then(res => {
        if (res.text())
          throw (res);
      })
      .catch(e => { throw e });
  }

  cite(p: amPost, add: boolean): Promise<void> {
    let c = new amCite;
    c.post = p._id;
    c.screen_name = this.globalService.myProfile.screen_name;
    return this.http
      .post(add ? "cite" : "uncite", JSON.stringify(c), this.globalService.makeHeaders())
      .toPromise()
      .then(res => {
        if (res.text())
          throw (res);
      })
      .catch(e => { throw e });
  }

  private handleError(error: any): void {
    this.globalService.handleError('Proposal service error', error);
  }
}
