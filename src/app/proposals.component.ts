import { Component, OnInit } from '@angular/core';
import { amProposal } from './classes';
import { amGlobalService } from './global.service';
import { amProfileService } from './profile.service';

@Component({
    selector: 'amProposals',
    templateUrl: 'proposals.component.html',
    styleUrls: ['proposals.component.css']
})
export class amProposalsComponent implements OnInit {
    constructor(public globalService: amGlobalService,
        private profileService: amProfileService) { }

    ngOnInit(): void {
        this.profileService.loadMyVotes();
    }

    getDate(p: amProposal): string {
        let d = new Date(p.close_date);
        return d.toLocaleDateString();
    }

    getVote(pid: string): string {
        let vote = this.globalService.myVotes.find(v => v.proposal === pid)
        if (vote)
            return vote.vote;
        else
            return "";
    }
}
