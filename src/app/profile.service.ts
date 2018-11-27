import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { amProfile, amUpdateProfile, amVote, amPost, amCite } from './classes';
import { amGlobalService } from './global.service';

@Injectable()
export class amProfileService {
  constructor(private globalService: amGlobalService,
    private http: Http) { }

  getText(name: string): Promise<void | string> {
    return this.http
      .get(name)
      .toPromise()
      .then(res => res.text())
      .catch(e => this.handleError(e));
  }

  getProfile(sn: string): Promise<void | amProfile> {
    if (!sn)
      sn = this.globalService.myProfile.screen_name;
    return this.http
      .get('profile/' + sn, this.globalService.makeHeaders())
      .toPromise()
      .then(response => response.json() as amProfile)
      .catch(e => this.handleError(e));
  }

  getVotes(sn: string): Promise<void | amVote[]> {
    return this.http
      .get('votes/' + sn)
      .toPromise()
      .then(response => response.json() as amVote[])
      .catch(e => this.handleError(e));
  }

  loadMyVotes() {
    this.getVotes(this.globalService.myProfile.screen_name)
      .then(v => {
        if (v) {
          this.globalService.myVotes = v;
          this.globalService.myVotes.forEach(e => {
            let prop = this.globalService.proposalHeads.find(p => p.id === e.proposal);
            if (prop.version !== e.version)
              e.vote = "*";
          });
        }
      })
      .catch(e => this.handleError(e));
  }

  getPosts(sn: string): Promise<void | amPost[]> {
    return this.http
      .get('posts/' + sn)
      .toPromise()
      .then(response => response.json() as amPost[])
      .catch(e => this.handleError(e));
  }

  getCites(): Promise<void | amCite[]> {
    return this.http
      .get("cites/" + this.globalService.myProfile.screen_name)
      .toPromise()
      .then(response => response.json() as amCite[])
      .catch(e => this.handleError(e));
  }

  saveProfile(profile: amProfile): Promise<void> {
    return this.http
      .put("profile", JSON.stringify(profile), this.globalService.makeHeaders())
      .toPromise()
      .then(res => {
        if (res.text()) {
          throw (res);
        }
      })
      .catch(e => { throw e });
  }

  updateProfile(up: amUpdateProfile): Promise<void> {
    return this.http
      .put("update", JSON.stringify(up), this.globalService.makeHeaders())
      .toPromise()
      .then(res => {
        if (res.text()) {
          throw (res);
        }
      })
      .catch(e => { throw e });
  }

  delete(sn: string): Promise<Response> {
    return this.http
      .delete("profile/" + sn, this.globalService.makeHeaders())
      .toPromise()
  }

  handleError(error: any): void {
    this.globalService.handleError('Profile service error', error);
  }
}
