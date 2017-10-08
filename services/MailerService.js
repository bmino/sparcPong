var mongoose = require('mongoose');
var Challenge = mongoose.model('Challenge');
var TeamChallenge = mongoose.model('TeamChallenge');
var Player = mongoose.model('Player');
var Team = mongoose.model('Team');

var nodemailer = require('nodemailer');
var xoauth2 = require('xoauth2');

var transporter = nodemailer.createTransport("SMTP", {
    service: 'gmail',
    auth: {
        XOAuth2: {
            user: process.env.EMAIL_ADDRESS,
            clientId: process.env.AUTH_CLIENT_ID,
            clientSecret: process.env.AUTH_CLIENT_SECRET,
            refreshToken: process.env.AUTH_CLIENT_REFRESH
        }
    }
});


module.exports.newTeamChallenge = function (teamChallengeId) {
    console.log('Checking email permissions for a new team challenge');

    TeamChallenge.populateById(teamChallengeId, true)
        .then(function(challenge) {
            var challenger = challenge.challenger;
            var challengee = challenge.challengee;
            if (challengee.leader.email && challengee.leader.alerts.team.challenged) {
                sendEmail('Doubles Challenge', 'Your team has been challenged by "'+ challenger.username +'." Log in at http://sparc-pong.herokuapp.com to deal with those scrubs!', challengee.leader.email);
            }
            if (challengee.partner.email && challengee.partner.alerts.team.challenged) {
                sendEmail('Doubles Challenge', 'Your team has been challenged by "'+ challenger.username +'." Log in at http://sparc-pong.herokuapp.com to deal with those scrubs!', challengee.partner.email);
            }
        })
        .catch(console.log);
};

module.exports.revokedTeamChallenge = function (teamChallengerId, teamChallengeeId) {
    console.log('Checking email permissions for a revoked team challenge');

    var challengerPromise = Team.findById(teamChallengerId).exec();
    var challengeePromise = Team.findById(teamChallengeeId).exec();
    var challengeeLeaderPromise = challengeePromise.then(function(challengee) {
        return Player.findById(challengee.leader).populate('alerts').exec();
    });
    var challengeePartnerPromise = challengeePromise.then(function(challengee) {
        return Player.findById(challengee.partner).populate('alerts').exec();
    });

    Promise.all([challengeeLeaderPromise, challengeePartnerPromise, challengerPromise])
        .then(function(values) {
            var leader = values[0];
            var partner = values[1];
            var challengerTeam = values[2];

            if (leader.email && leader.alerts.team.revoked) {
                sendEmail('Revoked Doubles Challenge', '"'+ challengerTeam.username +'" got scared and revoked a challenge against you.', leader.email);
            }
            if (partner.email && partner.alerts.team.revoked) {
                sendEmail('Revoked Doubles Challenge', '"'+ challengerTeam.username +'" got scared and revoked a challenge against you.', partner.email);
            }
        })
        .catch(console.log);
};

module.exports.resolvedTeamChallenge = function (teamChallengeId) {
    console.log('Checking email permissions for a resolved team challenge');

    TeamChallenge.populateById(teamChallengeId, true)
        .then(function(teamChallenge) {
            var winner = teamChallenge.getWinner();
            var loser = teamChallenge.getLoser();
            var loserLeader = loser.leader;
            var loserPartner = loser.partner;
            var winnerLeader = winner.leader;
            var winnerPartner = winner.partner;

            if (loserLeader.email && loserLeader.alerts.team.resolved) {
                sendEmail('Resolved Doubles Challenge', 'Welp, stuff happens. It looks like "'+ winner.username +'" really laid the smack on your team. Log in at http://sparc-pong.herokuapp.com and pick an easier team.', loserLeader.email);
            }
            if (loserPartner.email && loserPartner.alerts.team.resolved) {
                sendEmail('Resolved Doubles Challenge', 'Welp, stuff happens. It looks like "'+ winner.username +'" really laid the smack on your team. Log in at http://sparc-pong.herokuapp.com and pick an easier team.', loserPartner.email);
            }
            if (winnerLeader.email && winnerLeader.alerts.team.resolved) {
                sendEmail('Resolved Doubles Challenge', 'Congratulations on beating "'+ loser.username +'!" Log in at http://sparc-pong.herokuapp.com to crush some more feelings.', winnerLeader.email);
            }
            if (winnerPartner.email && winnerPartner.alerts.team.resolved) {
                sendEmail('Resolved Doubles Challenge', 'Congratulations on beating "'+ loser.username +'!" Log in at http://sparc-pong.herokuapp.com to crush some more feelings.', winnerPartner.email);
            }
        })
        .catch(console.log);
};

module.exports.forfeitedTeamChallenge = function (teamChallengeId) {
    console.log('Checking email permissions for a forfeited team challenge');

    TeamChallenge.populateById(teamChallengeId, true)
        .then(function(team) {
            if (team.challenger.leader.email && team.challenger.leader.alerts.team.forfeited) {
                sendEmail('Forfeited Doubles Challenge', 'That lil chicken of a team "'+ team.challengee.username +'" forfeited your challenge. You win by default!', team.challenger.leader.email);
            }
            if (team.challenger.partner.email && team.challenger.partner.alerts.team.forfeited) {
                sendEmail('Forfeited Doubles Challenge', 'That lil chicken of a team "'+ team.challengee.username +'" forfeited your challenge. You win by default!', team.challenger.partner.email);
            }
        })
        .catch(console.log);
};


module.exports.newChallenge = function (challengeId) {
    console.log('Checking email permission for a new challenge');

    Challenge.populateById(challengeId, true)
        .then(function(challenge) {
            if (challenge.challengee.email && challenge.challengee.alerts.challenged) {
                sendEmail('New Challenge', 'You have been challenged by '+ challenge.challenger.username +'. Log in at http://sparc-pong.herokuapp.com to deal with that scrub!', challenge.challengee.email);
            }
        })
        .catch(console.log);
};

module.exports.revokedChallenge = function (challengeId) {
    console.log('Checking email permission for a revoked challenge');

    Challenge.populateById(challengeId, true)
        .then(function(challenge) {
            if (challenge.challengee.email && challenge.challengee.alerts.revoked) {
                sendEmail('Revoked Challenge', challenge.challenger.username + ' got scared and revoked a challenge against you.', challenge.challengee.email);
            }
        })
        .catch(console.log);
};

module.exports.resolvedChallenge = function (challengeId) {
    console.log('Checking email permission for a resolved challenge');

    Challenge.populateById(challengeId, true)
        .then(function(challenge) {
            var loser = challenge.getWinner();
            var winner = challenge.getLoser();

            if (loser.email && loser.alerts.resolved) {
                sendEmail('Resolved Challenge', 'Welp, stuff happens. It looks like '+ winner.username +' really laid the smack on ya. Log in at http://sparc-pong.herokuapp.com and pick an easier opponent.', loser.email);
            }
            if (winner.email && winner.alerts.resolved) {
                sendEmail('Resolved Challenge', 'Congratulations on beating '+ loser.username +'! Log in at http://sparc-pong.herokuapp.com to crush some more feelings.', winner.email);
            }
        })
        .catch(console.log);
};

module.exports.forfeitedChallenge = function (challengeId) {
    console.log('Checking email permission for a forfeited challenge');

    Challenge.populateById(challengeId, true)
        .then(function(challenge) {
            if (challenge.challenger.email && challenge.challenger.alerts.forfeited) {
                sendEmail('Forfeited Challenge', 'That lil weasel, '+ challenge.challengee.username +', forfeited your challenge. You win by default!', challenge.challenger.email);
            }
        })
        .catch(console.log);
};


function sendEmail(subject, message, address) {
    console.log('Trying to send email to '+ address);

    var mailOptions = {
        to: address,
        from: process.env.EMAIL_TITLE +' <'+ process.env.EMAIL_ADDRESS +'>',
        subject: subject,
        text: message
    };

    transporter.sendMail(mailOptions, function(error, response) {
        if (error) return console.log(error);
        console.log('Message sent to ' + address);
    });
}