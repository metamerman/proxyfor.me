import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { switchMap } from 'rxjs/operators';

import { amProfile, amUpdateProfile, amVote, amPost } from './classes';
import { amAlertService } from './alert.service';
import { amGlobalService } from './global.service'
import { amProfileService } from './profile.service'

@Component({
  selector: 'profile',
  templateUrl: 'profile.component.html',
  styleUrls: ['profile.component.css']
})
export class amProfileComponent implements OnInit {
  profile = new amProfile(undefined);
  votes: amVote[];
  posts: amPost[];
  range = [1, 2, 3, 4, 5, 6, 7];
  b5r: string[] = [];
  ir: string[] = [];
  // miniprofile 3c, 20o, 24n(r), 11 (55, efficiency), 14 (58, environment), 18 (62, morality)
  mini_b5a: string[] = [];
  mini_b5i = [2, 19, 23];
  mini_wa: string[] = [];
  mini_wi = [10, 13, 17];
  incompletion: string;
  doMe: boolean = true;
  formL: FormGroup;
  formC: FormGroup;
  formP: FormGroup;
  active = true;
  showPassword = true;

  // <p>{{debug}}</p>
  // get debug() {
  //   let output: string = "";
  //   for (let i = 0; i < this.b5r.length; i++) {
  //     output += this.b5r[i];
  //   }
  //   output += " ";
  //   for (let i = 0; i < this.ir.length; i++) {
  //     output += this.ir[i];
  //   }
  //   return JSON.stringify(output);
  // }

  constructor(private router: Router,
    private fb: FormBuilder,
    private alertService: amAlertService,
    private globalService: amGlobalService,
    private profileService: amProfileService,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.buildFormL();
    this.buildFormC();
    this.buildFormP();
    this.votes = undefined;
    this.posts = undefined;
    if (!this.globalService.b5a) {
      this.profileService.getText("big5.txt").then(result => {
        if (result) {
          this.globalService.b5a = result.split("\n");
          this.mini_b5i.forEach(i => { this.mini_b5a[i] = this.globalService.b5a[i]; });
        }
      });
      this.profileService.getText("will.txt").then(result => {
        if (result) {
          this.globalService.ia = result.split("\n");
          this.mini_wi.forEach(i => { this.mini_wa[i] = this.globalService.ia[i]; });
        }
      });
    }
    this.route.params
      .pipe(switchMap((params: Params) => this.profileService.getProfile(params['sn'])))
      .subscribe(profile => {
        if (profile) {
          let newtab: string = null;
          this.profile = profile;
          this.b5r = this.profile.big5.split("");
          this.ir = this.profile.will.split("");

          if (this.profile.screen_name === this.globalService.myProfile.screen_name) {
            this.doMe = true;
            if (this.profile.big5.startsWith("0000000000000000000000")) // blank profile
              newtab = "Mini Match";
            else
              newtab = "Full Match";
          }
          else {
            this.doMe = false;
            newtab = "Votes";
          }
          this.globalService.activeTab = newtab;

          this.buildFormL();
          this.loadVotes(); // may want to delay these eventually
          this.loadPosts();
        }
      });
  }

  getTitle(pid: string): string {
    return this.globalService.proposalHeads.find(tp => tp.id === pid).title;
  }

  save(): void {
    this.profile.big5 = this.b5r.join("");
    this.profile.will = this.ir.join("");
    this.globalService.myProfile = this.profile;

    this.profileService.saveProfile(this.profile).catch(e => this.handleError(e));
    this.globalService.activeTab = "Locality";
  }

  exclude(): void {
    if (!this.globalService.myProfile.exclude)
      this.globalService.myProfile.exclude = [];
    this.globalService.myProfile.exclude.push(this.profile.screen_name);
    this.profileService.saveProfile(this.globalService.myProfile).catch(e => this.handleError(e));

    window.history.back();
  }

  include(sn: string): void {
    if (this.globalService.myProfile.exclude)
      this.globalService.myProfile.exclude = this.globalService.myProfile.exclude.filter(p => p != sn);
    this.profileService.saveProfile(this.globalService.myProfile).catch(e => this.handleError(e));
  }

  loadVotes(): void {
    if (!this.votes)
      this.profileService.getVotes(this.profile.screen_name)
        .then(v => { if (v) this.votes = v })
        .catch(e => this.handleError(e));
  }

  loadPosts(): void {
    if (!this.posts)
      this.profileService.getPosts(this.profile.screen_name)
        .then(p => { if (p) this.posts = p })
        .catch(e => this.handleError(e));
  }

  formErrorsL = {
    'city': '',
    'state': '',
    'country': ''
  };

  validationMessagesL = {
    'city': { 'required': 'City is required.' },
    'state': { 'required': 'State/Province/Canton is required.' },
    'country': { 'required': 'Country is required.' }
  };

  formErrorsC = {
    'oldpw': '',
    'email': ''
  };

  validationMessagesC = {
    'oldpw': { 'required': 'Password is required.' },
    'email': { 'required': 'Email address is required.' }
  };

  formErrorsP = {
    'oldpw': '',
    'newpw': '',
  };

  validationMessagesP = {
    'oldpw': { 'required': 'Current password is required.' },
    'newpw': { 'required': 'New password is required.' },
  };

  buildFormL(): void {
    this.formL = this.fb.group({
      'city': [this.profile.city, Validators.required],
      'state': [this.profile.state, Validators.required],
      'country': [this.profile.country, Validators.required]
    });
  }

  buildFormC(): void {
    this.formC = this.fb.group({
      'oldpw': [null, Validators.required],
      'email': [this.globalService.myProfile.email, Validators.required],
      'phone': [this.globalService.myProfile.phone],
    });
  }

  buildFormP(): void {
    this.formP = this.fb.group({
      'oldpw': [null, Validators.required],
      'newpw': [null, Validators.required]
    });
  }

  onSubmitL(): void {
    if (this.globalService.validate(this.formL, this.formErrorsL, this.validationMessagesL)) {
      this.globalService.myProfile.city = this.formL.value.city;
      this.globalService.myProfile.state = this.formL.value.state;
      this.globalService.myProfile.country = this.formL.value.country;
      this.profileService.saveProfile(this.globalService.myProfile)
        .then(() => this.router.navigate(["/proposal/" + this.globalService.proposal.id + 'v' + this.globalService.proposal.version]))
        .catch(e => this.handleError(e));
    }
  }

  onSubmitC(): void {
    if (this.globalService.validate(this.formC, this.formErrorsC, this.validationMessagesC)) {
      let p: amUpdateProfile = new amUpdateProfile();
      p.screen_name = this.globalService.myProfile.screen_name;
      p.oldpw = this.formC.value.oldpw;
      p.email = this.formC.value.email;
      p.phone = this.formC.value.phone;
      p.contact = this.globalService.myProfile.contact; // no way to get this out of form?
      this.update(p);
    }
  }

  onSubmitP(): void {
    if (this.globalService.validate(this.formP, this.formErrorsP, this.validationMessagesP)) {
      let p: amUpdateProfile = new amUpdateProfile();
      p.screen_name = this.globalService.myProfile.screen_name;
      p.oldpw = this.formP.value.oldpw;
      p.newpw = this.formP.value.newpw;
      this.update(p);
    }
  }

  update(p: amUpdateProfile): void {
    this.active = false;
    this.profileService.updateProfile(p)
      .then(() => this.alertService.success("Profile update succeeded!"))
      .catch(e => this.alertService.error("Profile update failed", e));
    this.active = true;
  }

  private handleError(error: any): void {
    this.globalService.handleError('Profile component error', error);
  }
}
