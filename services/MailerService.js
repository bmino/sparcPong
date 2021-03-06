const mongoose = require(`mongoose`);
const Challenge = mongoose.model(`Challenge`);
const TeamChallenge = mongoose.model(`TeamChallenge`);
const Player = mongoose.model(`Player`);
const Team = mongoose.model(`Team`);
const Authorization = mongoose.model(`Authorization`);
const nodemailer = require(`nodemailer`);
const xoauth2 = require(`xoauth2`);

const MailerService = {
    EMAIL_TITLE: process.env.EMAIL_TITLE || `Sparc Pong`,
    LADDER_URL: process.env.LADDER_URL || `http://localhost:${process.env.PORT}`,

    transporter : nodemailer.createTransport({
        host: `smtp.gmail.com`,
        port: 587,
        auth: {
            type: `OAuth2`,
            user: process.env.EMAIL_ADDRESS,
            clientId: process.env.AUTH_CLIENT_ID,
            clientSecret: process.env.AUTH_CLIENT_SECRET,
            refreshToken: process.env.AUTH_CLIENT_REFRESH
        }
    }),

    newTeamChallenge(teamChallengeId) {
        console.log(`Checking email permissions for a new team challenge`);

        TeamChallenge.populateById(teamChallengeId, true)
            .then((challenge) => {
                let challenger = challenge.challenger;
                let challengee = challenge.challengee;
                let outgoing = [];

                if (challengee.leader.email && challengee.leader.alerts.team.challenged) {
                    outgoing.push(MailerService.sendEmail(`Doubles Challenge`, `Your team has been challenged by "${challenger.username}." Log in at ${MailerService.LADDER_URL} to deal with those scrubs!`, challengee.leader.email));
                }
                if (challengee.partner.email && challengee.partner.alerts.team.challenged) {
                    outgoing.push(MailerService.sendEmail(`Doubles Challenge`, `Your team has been challenged by "${challenger.username}." Log in at ${MailerService.LADDER_URL} to deal with those scrubs!`, challengee.partner.email));
                }

                return Promise.all(outgoing);
            })
            .catch(console.log);
    },
    
    revokedTeamChallenge(teamChallengerId, teamChallengeeId) {
        console.log(`Checking email permissions for a revoked team challenge`);

        let challengerPromise = Team.findById(teamChallengerId).exec();
        let challengeePromise = Team.findById(teamChallengeeId).exec();
        let challengeeLeaderPromise = challengeePromise.then((challengee) => {
            return Player.findById(challengee.leader).populate(`alerts`).exec();
        });
        let challengeePartnerPromise = challengeePromise.then((challengee) => {
            return Player.findById(challengee.partner).populate(`alerts`).exec();
        });

        Promise.all([challengeeLeaderPromise, challengeePartnerPromise, challengerPromise])
            .then((values) => {
                let leader = values[0];
                let partner = values[1];
                let challengerTeam = values[2];
                let outgoing = [];

                if (leader.email && leader.alerts.team.revoked) {
                    outgoing.push(MailerService.sendEmail(`Revoked Doubles Challenge`, `Woah, "${challengerTeam.username}" got scared and revoked a challenge against you.`, leader.email));
                }
                if (partner.email && partner.alerts.team.revoked) {
                    outgoing.push(MailerService.sendEmail(`Revoked Doubles Challenge`, `Woah, "${challengerTeam.username}" got scared and revoked a challenge against you.`, partner.email));
                }

                return Promise.all(outgoing);
            })
            .catch(console.log);
    },
    
    resolvedTeamChallenge(teamChallengeId) {
        console.log(`Checking email permissions for a resolved team challenge`);

        TeamChallenge.populateById(teamChallengeId, true)
            .then((teamChallenge) => {
                let winner = teamChallenge.getWinner();
                let loser = teamChallenge.getLoser();
                let loserLeader = loser.leader;
                let loserPartner = loser.partner;
                let winnerLeader = winner.leader;
                let winnerPartner = winner.partner;
                let outgoing = [];

                if (loserLeader.email && loserLeader.alerts.team.resolved) {
                    outgoing.push(MailerService.sendEmail(`Resolved Doubles Challenge`, `Welp, stuff happens. It looks like "${winner.username}" really laid the smack on your team. Log in at ${MailerService.LADDER_URL} and pick an easier team.`, loserLeader.email));
                }
                if (loserPartner.email && loserPartner.alerts.team.resolved) {
                    outgoing.push(MailerService.sendEmail(`Resolved Doubles Challenge`, `Welp, stuff happens. It looks like "${winner.username}" really laid the smack on your team. Log in at ${MailerService.LADDER_URL} and pick an easier team.`, loserPartner.email));
                }
                if (winnerLeader.email && winnerLeader.alerts.team.resolved) {
                    outgoing.push(MailerService.sendEmail(`Resolved Doubles Challenge`, `Congratulations on beating "${loser.username}!" Log in at ${MailerService.LADDER_URL} to crush some more feelings.`, winnerLeader.email));
                }
                if (winnerPartner.email && winnerPartner.alerts.team.resolved) {
                    outgoing.push(MailerService.sendEmail(`Resolved Doubles Challenge`, `Congratulations on beating "${loser.username}!" Log in at ${MailerService.LADDER_URL} to crush some more feelings.`, winnerPartner.email));
                }

                return Promise.all(outgoing);
            })
            .catch(console.log);
    },
    
    forfeitedTeamChallenge(teamChallengeId) {
        console.log(`Checking email permissions for a forfeited team challenge`);

        TeamChallenge.populateById(teamChallengeId, true)
            .then((team) => {
                let outgoing = [];

                if (team.challenger.leader.email && team.challenger.leader.alerts.team.forfeited) {
                    outgoing.push(MailerService.sendEmail(`Forfeited Doubles Challenge`, `That lil chicken of a team "${team.challengee.username}" forfeited your challenge. You win by default!`, team.challenger.leader.email));
                }
                if (team.challenger.partner.email && team.challenger.partner.alerts.team.forfeited) {
                    outgoing.push(MailerService.sendEmail(`Forfeited Doubles Challenge`, `That lil chicken of a team "${team.challengee.username}" forfeited your challenge. You win by default!`, team.challenger.partner.email));
                }

                return Promise.all(outgoing);
            })
            .catch(console.log);
    },

    newChallenge(challengeId) {
        console.log(`Checking email permission for a new challenge`);

        Challenge.populateById(challengeId, true)
            .then((challenge) => {
                if (challenge.challengee.email && challenge.challengee.alerts.challenged) {
                    return MailerService.sendEmail(`New Challenge`, `You have been challenged by "${challenge.challenger.username}." Log in at ${MailerService.LADDER_URL} to deal with that scrub!`, challenge.challengee.email);
                }
            })
            .catch(console.log);
    },
    
    revokedChallenge(challengerId, challengeeId) {
        console.log(`Checking email permission for a revoked challenge`);

        Promise.all([
            Player.findById(challengerId).populate(`alerts`).exec(),
            Player.findById(challengeeId).populate(`alerts`).exec()
        ])
            .then((players) => {
                let challenger = players[0];
                let challengee = players[1];

                if (challengee.email && challengee.alerts.revoked) {
                    return MailerService.sendEmail(`Revoked Challenge`, `It appears that "${challenger.username}" got scared and revoked a challenge against you.`, challengee.email);
                }
            })
            .catch(console.log);
    },
    
    resolvedChallenge(challengeId) {
        console.log(`Checking email permission for a resolved challenge`);

        Challenge.populateById(challengeId, true)
            .then((challenge) => {
                let loser = challenge.getLoser();
                let winner = challenge.getWinner();
                let outgoing = [];

                if (loser.email && loser.alerts.resolved) {
                    outgoing.push(MailerService.sendEmail(`Resolved Challenge`, `Welp, stuff happens. It looks like "${winner.username}" really laid the smack on ya. Log in at ${MailerService.LADDER_URL} and pick an easier opponent.`, loser.email));
                }
                if (winner.email && winner.alerts.resolved) {
                    outgoing.push(MailerService.sendEmail(`Resolved Challenge`, `Congratulations on demolishing "${loser.username}!" Log in at ${MailerService.LADDER_URL} to crush some more feelings.`, winner.email));
                }

                return Promise.all(outgoing);
            })
            .catch(console.log);
    },
    
    forfeitedChallenge(challengeId) {
        console.log(`Checking email permission for a forfeited challenge`);

        Challenge.populateById(challengeId, true)
            .then((challenge) => {
                if (challenge.challenger.email && challenge.challenger.alerts.forfeited) {
                    return MailerService.sendEmail(`Forfeited Challenge`, `That lil weasel, "${challenge.challengee.username}" forfeited your challenge. You win by default!`, challenge.challenger.email);
                }
            })
            .catch(console.log);
    },

    newAutoChallenge(challengeId) {
        Challenge.populateById(challengeId, true)
            .then((challenge) => {
                return MailerService.sendEmail(`New Auto Challenge`, `A challenge has been automatically issued on your behalf against "${challenge.challengee.username}." Log in at ${MailerService.LADDER_URL} to wreck that hooligan!`, challenge.challenger.email);
            })
            .catch(console.log);
    },

    resetPassword(resetKey) {
        console.log(`Checking email for password reset.`);

        return Authorization.findByResetKey(resetKey)
            .then(Player.findByAuthorization)
            .then((player) => {
                if (!player) return Promise.reject(new Error(`Player could not be found`));
                if (!player.email) return Promise.reject(new Error(`Could not find an email for this player`));
                return MailerService.sendEmail(`Password Reset`, `Your reset key is: ${resetKey}\n You may reset your password at ${MailerService.LADDER_URL}/#!/resetPassword/${encodeURIComponent(resetKey)}`, player.email);
            })
            .catch((err) => {
                console.error(err);
                return Promise.reject(new Error(`Error sending password reset email`));
            });
    },

    sendEmail(subject, message, address) {
        if (!process.env.EMAIL_ADDRESS || !process.env.AUTH_CLIENT_ID || !process.env.AUTH_CLIENT_SECRET || !process.env.AUTH_CLIENT_REFRESH) {
            return Promise.reject(new Error(`Insufficient configuration provided to send emails`));
        }

        console.log(`Trying to send "${subject}" email to ${address}`);

        let mailOptions = {
            to: address,
            from: `${MailerService.EMAIL_TITLE} <${process.env.EMAIL_ADDRESS}>`,
            subject: subject,
            text: message
        };

        return MailerService.transporter.sendMail(mailOptions)
            .then((response) => {
                console.log(`${subject} email sent to ${address}`);
                return Promise.resolve(address);
            })
            .catch((err) => {
                console.error(err);
                return Promise.reject(new Error(`Error sending ${subject} email to ${address}`));
            });
    }
};


module.exports = MailerService;
