import { amProfile, amProposalHead, amVote, amProxyMatch, amPost } from "./classes";
import * as AWS from 'aws-sdk';
let config = require("./aws-ses-config.json");

export class amEmailer {
    ses: AWS.SES;

    init() {
        this.ses = new AWS.SES(config);
    }

    sendMatches(voter: amProfile, v: string, p: amProposalHead, matches: amProxyMatch[]) {
        let vote = v === "Y" ? "Yes" : "No";
        let subject = voter.screen_name + ": Your proxyfor.me vote on proposal " + p.id + " will be '" + vote + "'";
        let pname = p.id  + ": " + p.title;
        let text = "Your proxyfor.me vote on proposal:\n'" + pname + "'\nwill be '" + vote + "'.";
        text += "\n\nYour proxies and their votes:\n";
        for (let i = 0; i < matches.length; i++)
            if (matches[i].screen_name)
                text += matches[i].screen_name + ": match quality "
                    + matches[i].diff + ", vote " + (matches[i].vote == "Y" ? " 'Yes'\n" : " 'No'\n");
        text += "\nIf you don't cast a direct vote, a '" + vote
        text += "' vote will be cast for you at midnight (UTC) Sunday.\n";
        text += "If you want to learn more, or cast a direct vote, please go to https://www.proxyfor.me/";
        text += "\n\nTo unsubscribe: https://www.proxyfor.me/unsubscribe/" + voter._id;
        this.sendEmail(voter.email, subject, text);
    }

    sendResult(v: amVote, type: string, pf: string, p: amProposalHead, np: amProposalHead) {
        let pname = p.id  + ": " + p.title;
        let npname = np.id + ": " + np.title;
        let subject = v.screen_name + ": Proposal " + p.id + pf + ", Now vote on " + npname;
        let text = "Your " + type + " vote on proposal:\n'" + pname + "'\nwas " + (v.vote == "Y" ? " 'Yes'.\n" : " 'No'.\n");
        text += "That proposal" + pf;
        text += "\n\nThis week's proposal is:\n'" + npname + "'\n";
        text += "To cast a direct vote, please go to https://www.proxyfor.me/";
        text += "\n\nTo unsubscribe: http://proxyfor.me/unsubscribe/" + v.oid;
        this.sendEmail(v.email, subject, text);
    }

    emailQuestion(pid: string, creator_email: string, voter_name: string, voter_email: string, question: string) {
        let subject = "Q & A on proposal " + pid;
        let text = "Question from " + voter_name + " " + voter_email + "\n"
        text += question;
        this.sendEmail(creator_email, subject, text);
    }

    emailFlag(flagger: string, p: amPost) {
        let to = "gm@proxyfor.me";
        let subject = "Flag from " + flagger + " on poster " + p.screen_name + " on proposal " + p.proposal;
        let text = "Flagger: " + flagger + "\n";
        text += "Proposal: " + p.proposal + "\n";
        text += "Poster: " + p.screen_name + "\n";
        text += "Subject: " + p.subject + "\n";
        text += "Text: " + p.text;
        this.sendEmail(to, subject, text);
    }

    sendEmail(to: string, subject: string, text: string) {
        let ser: AWS.SES.SendEmailRequest = {
            Source: '"proxyfor.me" <system@proxyfor.me>',
            ReturnPath: "system@proxyfor.me",
            ReplyToAddresses: ["system@proxyfor.me"],
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject },
                Body: {
                    Text: { Data: text }
                }
            }
        }

        this.ses.sendEmail(ser, (err: any, data: any) => {
            if (err)
                console.log("sendEmail err", err);
            else
                console.log("sendEmail result", data);
        });
    }
}