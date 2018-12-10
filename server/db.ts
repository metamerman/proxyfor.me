import {
    amLogin, amProposal, amProposalHead, headFieldSpec, voteFieldSpec, amProfile,
    amUpdateProfile, profileGetSpec, profileSetSpec, amProxyMatch, amVote, amPost, amCite
} from "./classes";
import { MongoClient, Db, ObjectID } from "mongodb";
import { amEmailer } from "./email";

let crypto = require('crypto');
let jwt = require('jsonwebtoken');
var fs = require('fs');

const salt_length = 32;

// for creating sample votes
const ndirectbots = 100;
const nproxybots = 100;
const contactbot = 10; //bot10 and bot110 get test emails
const nposts = 0;

// OCEAN scoring for big5 inventory (bot voting)
// miniprofile in profile.component.ts
const oq = [5, 10, 15, 20, 25, 30, 40, 44];
const orq = [35, 41];
const cq = [3, 13, 28, 33, 38];
const crq = [8, 18, 23, 43];
const eq = [1, 11, 16, 26, 36];
const erq = [6, 21, 31];
const aq = [7, 17, 22, 32, 42];
const arq = [2, 12, 27, 37];
const nq = [4, 14, 19, 29, 39];
const nrq = [9, 24, 34];

// parameters for matching
const nmatches = 5;
const nb = 44;
const nw = 33;
const nresponses = 7;
const lotsazeros = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
const firstprop = Number.MAX_SAFE_INTEGER;
const curprop = Number.MAX_SAFE_INTEGER / 2;
const nextprop = (Number.MAX_SAFE_INTEGER / 2) - 1;
const email_delay = 100; // delay between email messages (keep under AWS rate limit)
const login_delay = 1000; // delay between login attempts

let db: Db;
let cachedheads: amProposalHead[];
let cachedvotes: amVote[][];
let botprofiles: amProfile[] = [];
let emailer: amEmailer;
let gmtoken: string;

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function gethash(salt: string, pw: string): string {
    if (!salt || !pw)
        return "";
    else
        return crypto.createHmac("sha256", salt).update(pw).digest("hex");
}

function random_int(maxval: number): number {
    return Math.floor(Math.random() * maxval) + 1;
}

function flip(t: number): number {
    if (t == 1) {
        return t + Math.floor(Math.random() * 2);
    }
    else if (t == 7) {
        return t - Math.floor(Math.random() * 2);
    }
    else
        return t + Math.floor(Math.random() * 3) - 1;
}

function populate(pp: number[], cells: number[], value: number) {
    let i: any;
    for (i in cells) {
        pp[cells[i]] = flip(value);
    }
}

function botvote(proposal: any) {
    let j: number, k: number;
    let posts: amPost[] = [];

    cachedvotes[proposal.id] = [];
    for (j = 0; j < ndirectbots; j++) {
        let openness = 0;
        for (k = 0; k < oq.length; k++)
            openness += botprofiles[j].big5.charCodeAt(oq[k] - 1) - 48;
        for (k = 0; k < orq.length; k++)
            openness += 8 - (botprofiles[j].big5.charCodeAt(orq[k] - 1) - 48);
        openness /= oq.length + orq.length;
        let vote = "N";
        if (proposal.oe > 0) {
            if (openness > proposal.oe)
                vote = "Y";
        }
        else
            if (openness < -proposal.oe)
                vote = "Y";
        cachedvotes[proposal.id][j] = new amVote(proposal, botprofiles[j], vote);
        if (vote === "Y")
            proposal.yes_votes++;
        else
            proposal.no_votes++;
        if (Math.random() < 0.2) {
            let text = "Post by " + botprofiles[j].screen_name + " on proposal " + proposal.id + ": It's a "
                + (cachedvotes[proposal.id][j].vote === "Y" ? "good idea." : "bad idea.");
            let post = new amPost;
            post.proposal = proposal.id;
            post.version = 0;
            post.screen_name = botprofiles[j].screen_name;
            post.category = cachedvotes[proposal.id][j].vote;
            post.subject = botprofiles[j].screen_name + "'s post on " + proposal.id;
            post.text = text;
            post.ncites = random_int(10);
            posts.push(post);
        }
    }
    proposal.order = (proposal.yes_votes + 1) / (proposal.no_votes + 1);
    db.collection("DirectVote").insertMany(cachedvotes[proposal.id]);
    db.collection("Post").insertMany(posts);
}

function setpw(p: amProfile) {
    p.salt = crypto.randomBytes(salt_length).toString("hex");
    p.hash = gethash(p.salt, p.screen_name);
    p.token = jwt.sign({ token: p.screen_name }, p.salt);
}

function createbots() {
    let i: number, j: number, k: number;

    console.log("Recreating bots...")
    let propdata: amProposal[] = require("./proposals.json");


    let nbots = ndirectbots + nproxybots;
    for (i = 0; i < nbots; i++) {
        botprofiles[i] = new amProfile("bot" + i);
        let pp: number[] = [];
        let t: number = random_int(nresponses);
        populate(pp, oq, t);
        populate(pp, orq, 8 - t);
        t = random_int(nresponses);
        populate(pp, cq, t);
        populate(pp, crq, 8 - t);
        t = random_int(nresponses);
        populate(pp, eq, t);
        populate(pp, erq, 8 - t);
        t = random_int(nresponses);
        populate(pp, aq, t);
        populate(pp, arq, 8 - t);
        t = random_int(nresponses);
        populate(pp, nq, t);
        populate(pp, nrq, 8 - t);
        for (j = 1; j <= nb; j++) {
            botprofiles[i].big5 += String.fromCharCode(48 + pp[j]);
        }
        for (j = 0; j < nw; j++) {
            botprofiles[i].will += String.fromCharCode(48 + flip(4));;
        }
        setpw(botprofiles[i]);
    }
    /* code to scale calculation of match quality
    let k = 0;
    let diffs: number[] = new Array;
    for (i = 0; i < nbots; i++)
        for (j = i + 1; j < nbots; j++)
            diffs[k++] = calculateMatch(profiles[i], profiles[j]);
    diffs.sort((a, b) => a - b);
    console.log(diffs.length, diffs[0], diffs[diffs.length/2], diffs[diffs.length-1]);*/
    botprofiles[contactbot].contact = botprofiles[contactbot + ndirectbots].contact = "e";

    for (i = 0; i < propdata.length; i++)
        botvote(propdata[i]);

    botprofiles[nbots] = new amProfile("gm");
    botprofiles[nbots].contact = "e";
    botprofiles[nbots].email = "gm@proxyfor.me";
    botprofiles[nbots].big5 = lotsazeros.substr(0, nb);
    botprofiles[nbots].will = lotsazeros.substr(0, nw);
    setpw(botprofiles[nbots]);

    propdata[0].order = firstprop;
    propdata[0].close_date = new Date();
    propdata[0].close_yes_votes = propdata[0].yes_votes;
    propdata[0].close_no_votes = propdata[0].no_votes;
    propdata[1].order = curprop;
    propdata[2].order = nextprop;
    db.collection("DirectVote").createIndex({ "proposal": 1 });
    db.collection("DirectVote").createIndex({ "screen_name": 1 });
    db.collection("Proposal").insertMany(propdata);
    db.collection("Proposal").createIndex({ "order": -1 });
    db.collection("Proposal").createIndex({ "id": 1 }, { unique: true });
    db.collection("Profile").insertMany(botprofiles);
    db.collection("Profile").createIndex({ "screen_name": 1 }, { unique: true });
    db.collection("Profile").createIndex({ "email": 1 }, { unique: true });
    db.collection("Profile").createIndex({ "token": 1 });
    db.collection("Post").createIndex({ "screen_name": 1 });
    db.collection("Post").createIndex({ "proposal": 1 });
    db.collection("Cite").createIndex({ "screen_name": 1 });
    db.collection("Cite").createIndex({ "post": 1 });
    db.collection("ProxyVote").createIndex({ "proposal": 1, "screen_name": 1 });
}

// turn raw sum of squares diff into rough 0-100 match quality
function scale_match(diff: number, nq: number): number {
    return Math.round(Math.min(100, Math.max(0, 97 - (Math.sqrt(diff * (nb + nw) / nq) - 9.6) * 4.4)));
}

function calculateMatch(p1: amProfile, p2: amProfile): number {
    let source: string = p1.big5;
    let ref: string = p2.big5;
    let sc, rc: number;
    let j: number, diff: number;
    let tdiff: number = 0;
    let nm: number = 0;
    for (j = 0; j < nb; j++) {
        sc = source.charCodeAt(j);
        rc = ref.charCodeAt(j);
        if (sc != 48 && rc != 48) {
            diff = sc - rc;
            tdiff += diff * diff;
            nm++;
        }
    }
    source = p1.will;
    ref = p2.will;
    for (j = 0; j < nw; j++) {
        sc = source.charCodeAt(j);
        rc = ref.charCodeAt(j);
        if (sc != 48 && rc != 48) {
            diff = sc - rc;
            tdiff += diff * diff;
            nm++;
        }
    }
    return scale_match(tdiff, nm);
}

function calculateMatches(profile: amProfile, pver: number, voters: amVote[]): amProxyMatch[] {
    let i: number, j: number;
    let matches: amProxyMatch[] = [];

    for (i = 0; i < nmatches + 1; i++)
        matches[i] = new amProxyMatch();
    let nvoters = voters.length;
    let myvote = "";

    for (i = 0; i < nvoters; i++) {
        if (voters[i].screen_name === profile.screen_name) {
            matches[nmatches].vote = voters[i].vote;
            matches[nmatches].version = voters[i].version;
        }
        else
            if (voters[i].vote != "A" && voters[i].version === pver
                && (!profile.exclude || !profile.exclude.includes(voters[i].screen_name))) {
                let diff: number;
                let source: string = profile.big5;
                let ref: string = voters[i].big5;
                let tdiff: number = 0;
                let sc, rc: number;
                let nm: number = 0;

                for (j = 0; j < nb; j++) {
                    sc = source.charCodeAt(j);
                    rc = ref.charCodeAt(j);
                    if (sc != 48 && rc != 48) {
                        diff = sc - rc;
                        tdiff += diff * diff;
                        nm++;
                    }
                }
                for (j = 0; j < nw; j++) {
                    sc = source.charCodeAt(j);
                    rc = ref.charCodeAt(j);
                    if (sc != 48 && rc != 48) {
                        diff = sc - rc;
                        tdiff += diff * diff;
                        nm++;
                    }
                }
                if (tdiff < matches[4].diff) {
                    matches[4].index = i;
                    matches[4].diff = tdiff;
                    matches[4].nm = nm;
                    matches.sort((a, b) => a.diff - b.diff)
                }
            }
    }
    for (i = 0; i < 5; i++) {
        if (matches[i].diff < Number.MAX_VALUE) {
            matches[i].diff = scale_match(matches[i].diff, matches[i].nm);
            matches[i].screen_name = voters[matches[i].index].screen_name;
            matches[i].vote = voters[matches[i].index].vote;
        }
    }
    return matches;
}

function makeMatches(t: string, pid: string, pver: number): Promise<amProxyMatch[]> {
    return new Promise((resolve, reject) => {
        db.collection("Profile").findOne({ token: t })
            .then(p => {
                if (!p)
                    return reject(new Error('no such profile'));
                if (cachedvotes[pid])
                    resolve(calculateMatches(p, pver, cachedvotes[pid]));
                else
                    db.collection("DirectVote").find({ proposal: pid })
                        .toArray()
                        .then(v => resolve(calculateMatches(p, pver, cachedvotes[pid] = v)))
                        .catch(e => reject(e));
            })
            .catch(e => reject(e));
    });
}

function emailMatches() {
    console.log("start matches at ", new Date())
    let pvotes: amVote[] = [];
    let cprop = cachedheads.find(p => p.order === curprop) as amProposal; // "current" marker
    let dvotes: amVote[] = cachedvotes[cprop.id];
    if (!dvotes)
        return console.error("No direct votes for proposal " + cprop.id + ", exiting emailMatches...");
    let stream = db.collection("Profile").find().stream();
    stream.on('error', (err) => {
        return console.error(err);
    });
    stream.on('data', (p: amProfile) => {
        if (!dvotes.find(d => d.screen_name === p.screen_name)) {
            let matches = calculateMatches(p, cprop.version, dvotes);
            if (matches.length) {
                matches.length--; // delete my vote
                let total = 0;
                for (let i = 0; i < matches.length; i++)
                    if (matches[i].vote === "Y")
                        total++;
                let v = (total > 2) ? "Y" : "N";
                let vote = new amVote(cprop, p, v);
                vote.oid = p._id;
                pvotes.push(vote);
                if (p.contact === "e") {
                    emailer.sendMatches(p, v, cprop, matches);
                    stream.pause();
                    setTimeout(() => {
                        stream.resume();
                    }, email_delay);
                }
            }
        }
    });
    stream.on('end', () => {
        console.log("end matches at ", new Date())
        db.collection("ProxyVote").insertMany(pvotes);
    });
}

function emailResults() {
    let cindex = cachedheads.findIndex(p => p.order == curprop)
    let stream = db.collection("ProxyVote").find({ proposal: cachedheads[cindex].id }).stream();
    stream.on('error', (err) => {
        return console.error(err);
    });
    let yv: number = 0;
    let nv: number = 0;
    stream.on('data', (v: amVote) => {
        if (v.vote === "Y")
            yv++;
        else
            nv++;
    });
    stream.on('end', () => {
        cachedheads[cindex].order = cachedheads[cindex - 1].order - 1;
        cachedheads[cindex + 1].order = curprop;
        cachedheads[cindex + 2].order = nextprop;
        for (let i = 0; i < 3; i++)
            db.collection("Proposal").updateOne({ id: cachedheads[cindex + i].id }, { $set: { order: cachedheads[cindex + i].order } })
                .catch(e => console.error(e));

        cachedheads[cindex].close_date = new Date();
        cachedheads[cindex].close_yes_votes = cachedheads[cindex].yes_votes += yv;
        cachedheads[cindex].close_no_votes = cachedheads[cindex].no_votes += nv;
        let newdir = __dirname + "/results/" + cachedheads[cindex].id + "v" + cachedheads[cindex].version;
        fs.mkdir(newdir);
        db.collection("Proposal").updateOne({ id: cachedheads[cindex].id },
            {
                $set: {
                    close_date: cachedheads[cindex].close_date, yes_votes: cachedheads[cindex].yes_votes,
                    no_votes: cachedheads[cindex].no_votes, close_yes_votes: cachedheads[cindex].close_yes_votes,
                    close_no_votes: cachedheads[cindex].close_no_votes
                }
            })
            .then(() => {
                db.collection("Proposal").findOne({ id: cachedheads[cindex].id })
                    .then(p => {
                        fs.writeFile(newdir + "/proposal.json", JSON.stringify(p), (err: any) => {
                            if (err)
                                console.error("Error writing proposal.json", err);
                        })
                    })
                    .catch(e => console.error(e));
            })
            .catch(e => console.error(e));

        let pf = cachedheads[cindex].yes_votes > cachedheads[cindex].no_votes ? " passed " : " failed ";
        pf += cachedheads[cindex].yes_votes + " to " + cachedheads[cindex].no_votes;
        let fd = fs.openSync(newdir + "/directvotes.txt", "w");
        let tab = "\t";
        let nl = "\n";
        stream = db.collection("DirectVote").find({ proposal: cachedheads[cindex].id }).stream();
        stream.on('error', (err) => {
            return console.error(err);
        });
        console.log("start direct results at ", new Date())
        stream.on('data', (v: amVote) => {
            let oid = new ObjectID(v._id);
            fs.writeSync(fd, oid.getTimestamp().getTime() + tab + v.screen_name + tab + v.vote + tab
                + v.big5 + tab + v.will + tab + nl);
            if (v.contact === "e") {
                emailer.sendResult(v, "direct", pf, cachedheads[cindex], cachedheads[cindex + 1]);
                stream.pause();
                setTimeout(() => {
                    stream.resume();
                }, email_delay);
            }
        });
        stream.on('end', () => {
            fs.closeSync(fd);
            fd = fs.openSync(newdir + "/proxyvotes.txt", "w");
            let c = cachedheads.find(p => p.order == curprop)
            stream = db.collection("ProxyVote").find({ proposal: cachedheads[cindex].id }).stream();
            stream.on('error', (err) => {
                return console.error(err)
            });
            console.log("start proxy results at ", new Date())
            stream.on('data', (v: amVote) => {
                let oid = new ObjectID(v._id);
                fs.writeSync(fd, oid.getTimestamp().getTime() + tab + v.screen_name + tab + v.vote + tab
                    + v.big5 + tab + v.will + nl);
                if (v.contact === "e") {
                    emailer.sendResult(v, "proxy", pf, cachedheads[cindex], cachedheads[cindex + 1]);
                    stream.pause();
                    setTimeout(() => {
                        stream.resume();
                    }, email_delay);
                }
            });
            stream.on('end', () => {
                console.log("end results at ", new Date())
                fs.closeSync(fd);
                db.collection("ProxyVote").drop();
                db.collection("ProxyVote").createIndex({ "proposal": 1, "screen_name": 1 });
                let pid = cachedheads[cindex + 1].id
                if (!cachedvotes[pid])
                    db.collection("DirectVote").find({ proposal: pid })
                        .toArray()
                        .then(v => cachedvotes[pid] = v)  // load up cache for next proposal (in case of restart)
                        .catch(e => console.error("Load cache votes error", e));
            });
        });

    });
}

// function repchar(dest: string, source: string, index: number) {
//     return dest.substring(0, index) + source.substring(index, index + 1) + dest.substring(index + 1);
// }

function loadcaches(resolve: any, reject: any) {
    db.collection("Profile").findOne({ screen_name: "gm" })
        .then(p => { gmtoken = p.token })
    db.collection("Proposal").find({}, headFieldSpec).sort({ order: -1 })
        .toArray()
        .then(h => {
            cachedheads = h;
            let cprop = cachedheads.find(p => p.order === curprop) as amProposal; // "current" marker
            db.collection("DirectVote").find({ proposal: cprop.id })
                .toArray()
                .then(v => {
                    cachedvotes[cprop.id] = v;
                    resolve(true);
                })
                .catch(e => reject(e));
        })
        .catch(e => reject(e));

    // Code to check mini against full match
    // db.collection("Profile").find().toArray().then(p => {
    //     let i, j;
    //     let mp: amProfile = new amProfile("temp");
    //     let ndiffs = 0;
    //     let fulldiff = 0;
    //     let minidiff = 0;
    //     let diffdiff = 0;
    //     for (i = 202; i < p.length; i++) {
    //         // miniprofile 3c, 20o, 7a(r), 46 (children), 50 (defense), 58 (environment)
    //         mp.big5 = lotsazeros.substr(0, nb);
    //         mp.big5 = repchar(mp.big5, p[i].big5, 2);
    //         mp.big5 = repchar(mp.big5, p[i].big5, 6);
    //         mp.big5 = repchar(mp.big5, p[i].big5, 19);
    //         mp.will = lotsazeros.substr(0, nw);
    //         mp.will = repchar(mp.will, p[i].will, 1);
    //         mp.will = repchar(mp.will, p[i].will, 5);
    //         mp.will = repchar(mp.will, p[i].will, 13);
    //         for (j = i + 1; j < p.length; j++) {
    //             ndiffs++;
    //             fulldiff = calculateMatch(p[i], p[j]);
    //             minidiff = calculateMatch(mp, p[j]);
    //             console.log(p[i].screen_name, p[j].screen_name, fulldiff, minidiff);
    //             diffdiff += Math.abs(fulldiff - minidiff);
    //         }
    //     }
    //     console.log(diffdiff / ndiffs);
    // });
}

export function init(): Promise<boolean> {
    emailer = new amEmailer;
    emailer.init();

    let CronJob = require('cron').CronJob;
    //       new CronJob('0 0 * * * *', emailMatches, null, true, 'UTC'); // every hour on the half hour
    //       new CronJob('0 30 * * * *', emailResults, null, true, 'UTC'); // every hour on the hour
    //new CronJob('0 0 0 * * 6', emailMatches, null, true, 'UTC'); // calculate automatch midnight Friday
    //new CronJob('0 0 0 * * 1', emailResults, null, true, 'UTC'); // calculate votes and update proposal midnight Sunday

    return new Promise((resolve, reject) => {
        MongoClient.connect('mongodb://localhost:27017/matchdb', { useNewUrlParser: true })
            .then(odb => {
                console.log("MongoDB opened");
                db = odb.db();
                cachedvotes = [];
                db.collections()
                    .then(c => {
                        let length = c.length;
                        if (length && process.argv.includes("-r"))
                            while (length)
                                c[--length].drop();
                        if (!length) {
                            createbots();
                            setTimeout(() => { // wait for server to digest
                                loadcaches(resolve, reject);
                            }, 2000);
                        }
                        else {
                            db.collection("Profile").find().sort({ _id: 1 }).limit(ndirectbots)
                                .toArray()
                                .then(b => botprofiles = b)
                                .catch(e => console.error(e)); // not sync, no resolve/reject
                            loadcaches(resolve, reject);
                        }
                    })
                    .catch(e => reject(e));
            })
            .catch(e => reject(e));
    });
}

export function getHeads(): amProposalHead[] {
    return cachedheads;
}

export function getProposal(pid: string): Promise<amProposal> {
    return new Promise((resolve, reject) => {
        let items = pid.split("v");
        db.collection("Proposal").findOne({ id: items[0] })
            .then(p => {
                delete p._id;
                db.collection("Post").find({ proposal: items[0] })
                    .toArray()
                    .then(posts => { p.posts = posts; resolve(p); })
                    .catch(e => reject(e));
            })
            .catch(e => reject(e));
    });
}

export function getProfile(t: string, sn: string): Promise<amProfile> {
    return new Promise((resolve, reject) => {
        db.collection("Profile").findOne({ screen_name: sn }, profileGetSpec)
            .then(p1 => {
                if (p1 && t) {
                    if (p1.screen_name === sn)
                        p1.token = t; // profileGetSpec doesn't include token, so copy it now
                    db.collection("Profile").findOne({ token: t })
                        .then(p2 => {
                            if (p2)
                                p1.diff = calculateMatch(p1, p2);
                            resolve(p1);
                        })
                        .catch(e => reject(e));
                }
                else
                    resolve(p1);
            })
            .catch(e => reject(e));
    })
}

export function getVotes(sn: string): Promise<amVote[]> {
    return db.collection("DirectVote").find({ screen_name: sn }).toArray();
}

export function getPosts(sn: string): Promise<amPost[]> {
    return db.collection("Post").find({ screen_name: sn }).toArray();
}

export function getCites(sn: string): Promise<amPost[]> {
    return db.collection("Cite").find({ screen_name: sn }).toArray();
}

export function getMatchVotes(token: string, pid: string): Promise<amProxyMatch[]> {
    let items = pid.split("v");
    return makeMatches(token, items[0], +items[1]);
}

export function unsubscribe(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let oid = new ObjectID(id);
        db.collection("Profile").updateOne({ _id: oid }, { $set: { contact: "n" } })
            .then((r) => {
                db.collection("Profile").findOne({ _id: oid })
                    .then(p => {
                        if (!p)
                            resolve('No such profile<br><br><a href="https://www,proxyfor.me/">'
                                + 'Go to https://www,proxyfor.me/</a>');
                        else
                            resolve('Profile for ' + p.email + ' set to no contact.<br><br><a href="https://www,proxyfor.me/">'
                                + 'Go to https://www,proxyfor.me/</a>');
                    })
                    .catch(e => reject(e));
            })
            .catch(e => reject(e))
    });
}

export function deleteSn(token: string, sn: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (token !== gmtoken)
            reject("Authorization failed: No permission");
        else
            reject("Authorization failed: Delete " + sn + " not implemented");
    });
}


export function setProfile(token: string, ip: string, profile: amProfile): Promise<string> {
    return new Promise((resolve, reject) => {
        db.collection("Profile").findOne({ screen_name: profile.screen_name })
            .then(p => {
                if (!p)
                    reject("Authorization failed: No such profile to set");
                else
                    if (token !== p.token)
                        reject("Authorization failed: Token validation failed in set");
                    else {
                        for (let f in profileSetSpec)
                            p[f] = profile[f];
                        p.city = capitalize(profile.city);
                        if (profile.vid || profile.housenum) {
                            db.collection("RegisteredVoters").findOne({
                                vid: profile.vid, state: profile.state, cc: profile.cc
                            }).then(rv => {
                                if (!rv)
                                    reject("Authorization failed: Voter information doesn't match");
                                else {
                                    fs.appendFileSync('authentications.log', [Date.now(), profile.vid, profile.fp, ip, "\n"].join(" "));
                                    p.auth = true;
                                    db.collection("Profile").updateOne({ _id: p._id }, { $set: p })
                                        .then(r => resolve(null))
                                        .catch(e => reject(e));
                                }
                            })
                        }
                        else
                            db.collection("Profile").updateOne({ _id: p._id }, { $set: p })
                                .then(r => resolve(null))
                                .catch(e => reject(e));
                    }
            })
            .catch(e => reject(e));
    });
}

export function updateProfile(token: string, u: amUpdateProfile): Promise<string> {
    return new Promise((resolve, reject) => {
        db.collection("Profile").findOne({ screen_name: u.screen_name })
            .then(p => {
                if (!p)
                    return reject("Authorization failed: No such profile to update");
                if (token === gmtoken)
                    p.status = u.status;
                else
                    if (token !== p.token || p.hash != gethash(p.salt, u.oldpw))
                        return reject("Authorization failed: Validation failed in update");
                if (u.newpw)
                    p.hash = gethash(p.salt, u.newpw);
                else {
                    p.email = u.email;
                    p.phone = u.phone;
                    p.contact = u.contact;
                }
                db.collection("Profile").updateOne({ _id: p._id }, { $set: p })
                    .then(r => resolve(null))
                    .catch(e => reject(e));
            })
            .catch(e => reject(e));
    });
}

export function setProposal(token: string, proposal: amProposal): Promise<string> {
    return new Promise((resolve, reject) => {
        db.collection("Profile").findOne({ token: token })
            .then(proposer => {
                if (!proposer)
                    return reject("Authorization failed: No such proposer to set");
                db.collection("Proposal").findOne({ id: proposal.id })
                    .then(p => {
                        if (!p)
                            if (proposer.screen_name === "gm") {
                                proposal.order = proposal.yes_votes = proposal.no_votes = 0;
                                proposal.close_date = undefined;
                                if (proposal.oe)
                                    botvote(proposal);
                                return db.collection("Proposal").insertOne(proposal)
                                    .then(() => loadcaches(resolve, reject));
                            }
                            else
                                return reject("Authorization failed: No such proposal");
                        if (proposer.screen_name !== "gm" && proposal.proposer !== proposer.screen_name)
                            return reject("Authorization failed: Not owner of that proposal");
                        if (proposal.version != p.version) {
                            proposal.order = proposal.yes_votes = proposal.no_votes
                                = proposal.close_yes_votes = proposal.close_no_votes = 0; // reset votes, put proposal at end of queue
                            proposal.close_date = undefined;
                            if (proposal.oe)
                                botvote(proposal);
                        }
                        db.collection("Proposal").updateOne({ _id: p._id }, { $set: proposal })
                            .then(() => loadcaches(resolve, reject))
                            .catch(e => reject(e));
                    })
                    .catch(e => reject(e));
            })
            .catch(e => reject(e));
    });
}

export function flag(t: string, p: amPost): Promise<string> {
    return new Promise((resolve, reject) => {
        db.collection("Profile").findOne({ token: t })
            .then(flagger => {
                if (!flagger)
                    return reject("Authorization failed: Must be logged in to flag");
                if (flagger.screen_name === "gm") {
                    db.collection("Post").deleteOne({ _id: new ObjectID(p._id) })
                        .then((r) => resolve(null))
                        .catch(e => reject(e));
                }
                else {
                    emailer.emailFlag(flagger.screen_name, p);
                    resolve(null);
                }
            })
            .catch(e => reject(e));
    })
}

export function vote(t: string, vote: amVote): Promise<string> {
    return new Promise((resolve, reject) => {
        db.collection("Profile").findOne({ token: t })
            .then(voter => {
                if (!voter)
                    return reject("Authorization failed: Must be logged in to vote");
                vote.oid = voter._id; // copy over stuff for matches and results notification
                vote.contact = voter.contact;
                vote.email = voter.email;
                vote.phone = voter.phone;
                vote.big5 = voter.big5;
                vote.will = voter.will;
                let varray: amVote[] = cachedvotes[vote.proposal];
                if (!varray)
                    varray = cachedvotes[vote.proposal] = [];
                let oldvote: amVote = varray.find(v => v.screen_name === vote.screen_name)
                let yinc = vote.vote === "Y" ? 1 : 0;
                let ninc = vote.vote === "N" ? 1 : 0;
                if (oldvote)
                    if (oldvote.vote === vote.vote)
                        return resolve(null);
                    else {
                        if (oldvote.vote === "Y")
                            yinc = -1;
                        else
                            if (oldvote.vote === "N")
                                ninc = -1;
                        Object.assign(oldvote, vote);
                    }
                else
                    varray.push(vote);
                db.collection("DirectVote").updateOne(
                    { screen_name: vote.screen_name, proposal: vote.proposal }, { $set: vote }, { upsert: true, w: 1 })
                    .then(r => {
                        // potential non-atomic operation here (two finds before update) and we can't use findOneAndUpdate to set "order" field.
                        // accurate vote count comes from vote documents, not the numbers in proposal, so we'll punt on this until we get mutexes.
                        db.collection("Proposal").findOne({ id: vote.proposal }, voteFieldSpec)
                            .then(p => {
                                p.yes_votes += yinc;
                                p.no_votes += ninc;
                                if (p.order < nextprop)
                                    p.order = (p.yes_votes + 1000) / (p.no_votes + 1000); // 1000 is to provide stability (anti-brigading)
                                cachedheads.sort((a, b) => b.order - a.order);
                                db.collection("Proposal").updateOne({ id: vote.proposal }, { $set: p })
                                    .then(p => {
                                        db.collection("ProxyVote").deleteOne({ screen_name: vote.screen_name, proposal: vote.proposal })
                                            .then(() => resolve(null))
                                            .catch(e => reject(e));
                                    })
                                    .catch(e => reject(e));
                            })
                            .catch(e => reject(e));
                    })
                    .catch(e => reject(e));
            });
    });
}

export function post(t: string, p: amPost): Promise<string> {
    return new Promise((resolve, reject) => {
        db.collection("Profile").findOne({ token: t })
            .then(voter => {
                if (!voter)
                    return reject("Authorization failed: Must be logged in to post");
                if (voter.status === "n")
                    return reject("Authorization failed: Posting denied due to abuse");
                if (p.category === "q") {
                    if (voter.screen_name === "gm") {
                        emailMatches();
                        setTimeout(() => {
                            emailResults();
                        }, 20000);
                        resolve(null);
                    }
                    else {
                        db.collection("Proposal").findOne({ id: p.proposal })
                            .then(proposal => {
                                db.collection("Profile").findOne({ screen_name: proposal.proposer })
                                    .then(proposer => {
                                        emailer.emailQuestion(proposal.id, proposer.email, voter.screen_name, voter.email, p.text);
                                        resolve(null);
                                    })
                                    .catch(e => reject(e));
                            })
                            .catch(e => reject(e));
                    }
                }
                else {
                    delete p._id;
                    db.collection("Post").updateOne({ proposal: p.proposal, screen_name: p.screen_name }, { $set: p }, { upsert: true })
                        .then(r => resolve(null))
                        .catch(e => reject(e));
                }
            })
            .catch(e => reject(e));
    });
}

export function cite(t: string, c: amCite, add: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        db.collection("Profile").findOne({ token: t })
            .then(citer => {
                if (!citer)
                    return reject("Authorization failed: Must be logged in to cite");
                delete c._id;
                let oid = new ObjectID(c.post);
                if (add)
                    db.collection("Cite").updateOne(c, { $set: c }, { upsert: true })
                        .then((r) => {
                            db.collection("Post").findOneAndUpdate({ _id: oid }, { $inc: { ncites: 1 } })
                                .then(() => resolve(null))
                                .catch(e => reject(e));
                        })
                        .catch(e => reject(e));
                else
                    db.collection("Cite").deleteOne(c)
                        .then((r) => {
                            db.collection("Post").findOneAndUpdate({ _id: oid }, { $inc: { ncites: -1 } })
                                .then(() => resolve(null))
                                .catch(e => reject(e));
                        })
                        .catch(e => reject(e));
            })
            .catch(e => reject(e));
    })
}

export function exists(li: amLogin): Promise<string> {
    return new Promise((resolve, reject) => {
        db.collection("Profile").findOne(li.screen_name ? { screen_name: li.screen_name } : { email: li.email })
            .then(p => resolve((p != null).toString()))
            .catch(e => reject(e));
    });
}

// does both log in and registration, depending on whether amLogin has an email address
export function login(t: string, li: amLogin): Promise<string> {
    return new Promise((resolve, reject) => {
        db.collection("Profile").findOne({ screen_name: li.screen_name })
            .then(p => {
                if (!p) {
                    if (li.email) {
                        p = new amProfile(li.screen_name);
                        p.contact = "e";
                        p.email = li.email;
                        p.big5 = lotsazeros.substr(0, nb);
                        p.will = lotsazeros.substr(0, nw);
                    }
                    else
                        return resolve(null);
                }
                if (!p.salt)
                    p.salt = crypto.randomBytes(salt_length).toString("hex");
                let newhash: string = gethash(p.salt, li.password);
                if (p.hash) // existing profile login check
                    if (p.hash === newhash || t === gmtoken) // normal login or via su
                        resolve(p.token);
                    else
                        setTimeout(() => {
                            resolve(null); // login failed
                        }, login_delay);
                else {
                    p.hash = newhash;  // create new profile
                    p.token = jwt.sign({ token: p.screen_name }, p.salt);
                    db.collection("Profile").updateOne({ screen_name: p.screen_name }, { $set: p }, { upsert: true })
                        .then(r => resolve(p.token))
                        .catch(e => reject(e));
                }
            });
    });
}