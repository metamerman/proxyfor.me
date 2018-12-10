export class amLogin {
    screen_name: string;
    password: string;
    email: string;
    token: string;
}

export class amProposal {
    _id: string;            // creation date encoded in id
    id: string;             // human-readable code
    version: number;
    title: string;
    proposer: string;
    abstract: string;
    cost: string;
    effective_date: string;
    history: string;
    justification: string;
    full_text: string;
    q_a: string;
    close_date: Date;       // date voting closed
    close_yes_votes: number;
    close_no_votes: number;
    close_a_votes: number;
    yes_votes: number;      // optimizations...
    no_votes: number;
    a_votes: number;
    order: number;          // sort order = yes_votes / no_votes (in queue) or by order voted
    posts: amPost[];        // extract from post collection on query
    oe: number;             // -7 to 7 "openness" score estimate (negative numbers mean conservatives will vote *for* proposal)
}

// query spec for mongo to extract amProposalHead from amProposal documents
export const headFieldSpec = {
    fields: {
        _id: 0, id: 1, title: 1, version: 1, close_date: 1, close_yes_votes: 1, close_no_votes: 1,
        yes_votes: 1, no_votes: 1, order: 1
    }
}
// query spec for mongo to extract fields to update current vote counts
export const voteFieldSpec = { fields: { _id: 0, yes_votes: 1, no_votes: 1, order: 1 } }

export class amProposalHead {
    id: string;             // human-readable code
    title: string;
    version: number;
    close_date: Date;        // date voting closed
    close_yes_votes: number;
    close_no_votes: number;
    yes_votes: number;      // optimizations...
    no_votes: number;
    order: number;
    constructor(source: amProposal) {
        this.version = source.version;
        this.title = source.title;
        this.close_date = source.close_date;
        this.close_yes_votes = source.close_yes_votes;
        this.close_no_votes = source.close_no_votes;
        this.yes_votes = source.yes_votes;
        this.no_votes = source.no_votes;
    }
}

export const profileGetSpec = {
    fields: {
        _id: 0, screen_name: 1, city: 1, state: 1, cc: 1, auth: 1,
        exclude: 1, big5: 1, will: 1, contact: 1, email: 1, phone: 1
    }
}

export const profileSetSpec = {
    city: 1, state: 1, cc: 1, auth: 1, exclude: 1,
    big5: 1, will: 1, contact: 1, email: 1, phone: 1
}

export class amProfile {
    _id: string;
    screen_name: string;
    status: string;         // s(uspend account), n(o post)
    contact: string;        // preferred means of notification e(mail), t(ext), n(one)
    email: string;
    phone: string;          // for SMS
    city: string;
    state: string;
    cc: string;
    auth: boolean;
    vid: number;
    housenum: number;
    fp: number;
    exclude: string[];      // array of profile ids to exclude from matches
    big5: string;   // when profiles are changed, append old profile to log file
    will: string;
    diff: number;
    //  credentials: string[];  // eventually people will qualify for credentials...
    ncites: number;         //optimizations...
    salt: string;
    hash: string;
    token: string;
    constructor(name: string) {
        this.screen_name = name;
        if (name) {                   // for bots
            this.email = '"' + name + '" <metamerman@gmail.com>';
            this.big5 = "";
            this.will = "";
            this.contact = "n";
        }
        else
            this.big5 = "0"; // flag as incomplete profile
    }
}

export class amUpdateProfile {
    screen_name: string;
    oldpw: string;
    newpw: string;
    email: string;
    phone: string;
    contact: string;
    status: string;    
}

export class amProxyMatch {
    index: number;
    diff: number;
    nm: number;
    version: number;
    screen_name: string;
    vote: string;
    constructor() {
        this.diff = Number.MAX_VALUE;
    }
}

// proxy vote and base for direct vote
export class amVote {
    _id: string;             // date is encoded in id
    proposal: string;
    version: number;
    screen_name: string;
    vote: string;           // y n a
    big5: string;   // for match votes
    will: string;
    contact: string;        // preferred means of notification e(mail), t(ext), n(one)
    email: string;
    phone: string;          // for SMS
    oid: string;            // for unsubscribe message
    constructor(proposal: amProposal, profile: amProfile, v: string) {
        this.proposal = proposal.id;
        this.version = proposal.version;
        this.screen_name = profile.screen_name;
        this.contact = profile.contact;
        this.email = profile.email;
        this.phone = profile.phone;
        this.big5 = profile.big5;
        this.will = profile.will;
        this.vote = v;
    }
}

// also used to post a question
export class amPost {
    _id: string;            // date encoded here
    proposal: string;       // proposal id indexed
    version: number;
    screen_name: string;    // user id indexed
    subject: string;        // subject line
    text: string;           // full text indexed
    category: string;       // y, n
    ncites: number;         // optimization
}

export class amCite {
    _id: string;
    post: string;           // id of post
    screen_name: string;
}

export class amRegisteredVoter {
    _id: string;
    vid: string;
    state: string;
    cc: string;
    housenum: string;
    city: string;
}