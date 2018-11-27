import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import * as marked from 'marked';
marked.setOptions({ sanitize: true });

import { amProposal, amProxyMatch, amVote, amPost } from './classes';
import { amAlertService } from './alert.service';
import { amGlobalService } from './global.service';
import { amProposalService } from './proposal.service';

@Component({
  selector: 'amProposal',
  templateUrl: 'proposal.component.html',
  styleUrls: ['proposal.component.css']
})
export class amProposalComponent implements OnInit {
  active: boolean = true;
  abstract: string;
  full_text: string;
  justification: string;
  q_a: string;
  matches: amProxyMatch[];
  pros: amPost[];
  cons: amPost[];
  myPostSubject: string = "";
  myPostText: string = "";
  sortBy: string = "dateNew";
  directvote: string;
  directversion: number;
  showvotes: boolean;
  cvote: string;
  formQ: FormGroup;
  formP: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private alertService: amAlertService,
    public globalService: amGlobalService,
    private proposalService: amProposalService) { }

  idToDate = function (id: string): string {
    let date = new Date(parseInt(id.substring(0, 8), 16) * 1000);
    return date.toLocaleString();
  }

  remarked(s: string): string {
    if (s)
      return marked(s).replace(/<a href=/g, '<a target="_blank" href=');
    else
      return s;
  }

  ngOnInit(): void {
    this.buildFormQ();
    this.buildFormP();
    
    this.route.params
      .pipe(switchMap((params: Params) => this.proposalService.getProposal('proposal/' + params['id'])))
      .subscribe(proposal => {
        if (proposal) {
          this.pros = [];
          this.cons = [];
          this.myPostSubject = undefined;
          this.myPostText = undefined;
          while (proposal.posts.length) {
            let t = proposal.posts.pop();
            if (t.screen_name === this.globalService.myProfile.screen_name) {
              this.myPostSubject = t.subject;
              this.myPostText = t.text;
            }
            t.text = this.remarked(t.text);
            if (t.category === "Y")
              this.pros.push(t);
            else
              this.cons.push(t);
          }
          this.reSort();
          this.buildFormP();
          this.abstract = this.remarked(proposal.abstract);
          this.full_text = this.remarked(proposal.full_text);
          this.justification = this.remarked(proposal.justification);
          this.q_a = this.remarked(proposal.q_a);
          this.globalService.proposal = proposal;
          if (proposal.close_date || this.globalService.myProfile.screen_name === "gm" || this.globalService.myProfile.screen_name === proposal.proposer)
            this.showvotes = true;
          else
            this.showvotes = false;
        }
      });
    if (this.globalService.myProfile.token) {
      this.route.params
        .pipe(switchMap((params: Params) => this.proposalService.getMatches('matches/' + params['id'])))
        .subscribe(matches => {
          if (!matches) // server doesn't know us
            this.globalService.logout();
          else {
            this.matches = matches;
            if (matches.length != 0) { // 0 means no profile
              let i: number;
              let total: number = 0;
              this.directvote = matches[matches.length - 1].vote;
              // stuff for feedback on number of items matched
              // setStatus(): void {
              //   let index = this.profile.big5.indexOf("0");
              //   if (index === -1) {
              //     index = this.profile.will.indexOf("0");
              //     if (index !== -1)
              //       index += this.profile.big5.length;
              //   }
              //   if (index++ !== -1)
              //     this.incompletion = "Item " + index + " is required";
              //   else
              //     this.incompletion = undefined;
              // }

              this.directversion = matches[matches.length - 1].version;
              matches.length = matches.length - 1;
              for (i = 0; i < matches.length; i++)
                if (matches[i].vote == "Y")
                  total++;
              this.cvote = (total > 2) ? "Y" : "N";
            }
            else
              this.directvote = undefined;
          }
        })
    }
  }

  reSort() {
    switch (this.sortBy) {
      case "dateNew":
        this.pros.sort((a, b) => -(a._id > b._id) || +(a._id != b._id));
        this.cons.sort((a, b) => -(a._id > b._id) || +(a._id != b._id));
        break;
      case "dateOld":
        this.pros.sort((a, b) => -(a._id < b._id) || +(a._id != b._id));
        this.cons.sort((a, b) => -(a._id < b._id) || +(a._id != b._id));
        break;
      case "citeMost":
        this.pros.sort((a, b) => -(a.ncites > b.ncites) || +(a.ncites != b.ncites));
        this.cons.sort((a, b) => -(a.ncites > b.ncites) || +(a.ncites != b.ncites));
        break;
      case "citeLeast":
        this.pros.sort((a, b) => -(a.ncites < b.ncites) || +(a.ncites != b.ncites));
        this.cons.sort((a, b) => -(a.ncites < b.ncites) || +(a.ncites != b.ncites));
        break;
      case "sn":
        this.pros.sort((a, b) => -(a.screen_name < b.screen_name) || +(a.screen_name != b.screen_name));
        this.cons.sort((a, b) => -(a.screen_name < b.screen_name) || +(a.screen_name != b.screen_name));
        break;
    }
  }

  flag(p: amPost) {
    this.proposalService.flag(p)
      .then(s => this.alertService.success("Flag succeeded!"))
      .catch(e => this.alertService.error("Flag failed", e));
  }

  vote(v: string): void {
    if (this.directvote !== v || this.directversion !== this.globalService.proposal.version) {
      this.directvote = v;
      this.directversion = this.globalService.proposal.version;
      let vote: amVote = new amVote(this.globalService.proposal, this.globalService.myProfile, v);
      this.proposalService.vote(vote).catch(e => this.handleError(e));
      this.globalService.myVotes.push(vote);
    }
  }

  formErrorsQ = {
    'text': ''
  };

  validationMessagesQ = {
    'text': { 'required': 'Question is required.' }
  };

  formErrorsP = {
    'subject': '',
    'text': ''
  };

  validationMessagesP = {
    'subject': { 'required': 'Post subject is required.' },
    'text': {
      'required': 'Post text is required.',
      'minlength': "This ain't Twitter: Please make a substantive comment (140 character minimum)",
      'maxlength': "Let's not get carried away (4K maximum length)"
    }
  };


  buildFormQ(): void {
    this.formQ = this.fb.group({
      'text': [null, Validators.required],
    });
  }

  buildFormP(): void {
    this.formP = this.fb.group({
      'subject': [this.myPostSubject, Validators.required],
      'text': [this.myPostText, [Validators.required, Validators.minLength(140), Validators.maxLength(4096)]]
    });
  }

  onSubmitQ() {
    if (this.globalService.validate(this.formQ, this.formErrorsQ, this.validationMessagesQ)) {
      let v: amPost = this.formQ.value;
      v.category = "q";
      this.submit(v);
    }
  }

  onSubmitP() {
    if (this.globalService.validate(this.formP, this.formErrorsP, this.validationMessagesP)) {
      let p: amPost = this.formP.value;
      p.category = this.directvote;
      p.ncites = 0;
      p.version = this.globalService.proposal.version;
      this.myPostSubject = p.subject;
      this.myPostText = p.text;
      this.submit(p);
    }
  }

  updatePost(l: amPost[], v: amPost, sn: string) {
    let d = new Date();
    v._id = Math.floor(d.getTime() / 1000).toString(16) + "0000000000000000";
    v.text = this.remarked(v.text);

    let cindex = l.findIndex(p => p.screen_name === sn)
    if (cindex !== -1) {
      l[cindex]._id = v._id;
      l[cindex].subject = v.subject;
      l[cindex].text = v.text;
    }
    else
      l.push(v);
    this.sortBy = "dateNew";
    this.reSort();
  }

  submit(p: amPost) {
    this.active = false;
    p.proposal = this.globalService.proposal.id;
    p.version = this.globalService.proposal.version;
    p.screen_name = this.globalService.myProfile.screen_name;
    this.proposalService.post(p)
      .then(() => {
        this.alertService.success("Post succeeded!");
        if (p.category !== "q")
          if (this.directvote === "Y")
            this.updatePost(this.pros, p, this.globalService.myProfile.screen_name);
          else
            this.updatePost(this.cons, p, this.globalService.myProfile.screen_name);
      })
      .catch(e => this.alertService.error("Post failed", e));
    this.active = true;
  }

  cite(p: amPost) {
    this.proposalService.cite(p, true)
      .then(() => {
        this.globalService.myCites[p._id] = true;
        p.ncites++;
      })
      .catch(e => this.alertService.error("Cite failed", e));
  }

  uncite(p: amPost) {
    this.proposalService.cite(p, false)
      .then(() => {
        delete this.globalService.myCites[p._id];
        p.ncites--;
      })
      .catch(e => this.alertService.error("Uncite failed", e));
  }

  private handleError(error: any): void {
    this.globalService.handleError('Proposal component error', error);
  }
}