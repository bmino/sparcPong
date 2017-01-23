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
            refreshToken: process.env.AUTH_CLIENT_REFRESH,
        }
    }
});


module.exports.newTeamChallenge = function (challenger, challengee) {
    console.log('Checking email permissions for a new team challenge');
    Player.findById(challengee.leader).populate('alerts').exec(function(err, leader) {
        if (err) {
            console.log(err);
        } else if (leader.email && leader.alerts.team.challenged) {
            sendEmail('Doubles Challenge', 'Your team has been challenged by "'+ challenger.username +'." Log in at http://sparc-pong.herokuapp.com to deal with those scrubs!', leader.email);
        }
    });
    Player.findById(challengee.partner).populate('alerts').exec(function(err, partner) {
        if (err) {
            console.log(err);
        } else if (partner.email && partner.alerts.team.challenged) {
            sendEmail('Doubles Challenge', 'Your team has been challenged by "'+ challenger.username +'." Log in at http://sparc-pong.herokuapp.com to deal with those scrubs!', partner.email);
        }
    });
};

module.exports.revokedTeamChallenge = function (challenger, challengee) {
    console.log('Checking email permissions for a revoked team challenge');
    Player.findById(challengee.leader).populate('alerts').exec(function(err, leader) {
        if (err) {
            console.log(err);
        } else if (leader.email && leader.alerts.team.revoked) {
            sendEmail('Revoked Doubles Challenge', '"'+ challenger.username +'" got scared and revoked a challenge against you.', leader.email);
        }
    });
    Player.findById(challengee.partner).populate('alerts').exec(function(err, partner) {
        if (err) {
            console.log(err);
        } else if (partner.email && partner.alerts.team.revoked) {
            sendEmail('Revoked Doubles Challenge', '"'+ challenger.username +'" got scared and revoked a challenge against you.', partner.email);
        }
    });
};

module.exports.resolvedTeamChallenge = function (winner, loser) {
    console.log('Checking email permissions for a resolved team challenge');
    // Contacts losers
    Player.findById(loser.leader).populate('alerts').exec(function(err, loserLeader) {
        if (err) {
            console.log(err);
        } else if (loserLeader.email && loserLeader.alerts.team.resolved) {
            sendEmail('Resolved Doubles Challenge', 'Welp, stuff happens. It looks like "'+ winner.username +'" really laid the smack on your team. Log in at http://sparc-pong.herokuapp.com and pick an easier team.', loserLeader.email);
        }
    });
    Player.findById(loser.partner).populate('alerts').exec(function(err, loserPartner) {
        if (err) {
            console.log(err);
        } else if (loserPartner.email && loserPartner.alerts.team.resolved) {
            sendEmail('Resolved Doubles Challenge', 'Welp, stuff happens. It looks like "'+ winner.username +'" really laid the smack on your team. Log in at http://sparc-pong.herokuapp.com and pick an easier team.', loserPartner.email);
        }
    });

    // Contacts winners
    Player.findById(winner.leader).populate('alerts').exec(function(err, winnerLeader) {
        if (err) {
            console.log(err);
        } else if (winnerLeader.email && winnerLeader.alerts.team.resolved) {
            sendEmail('Resolved Doubles Challenge', 'Congratulations on beating "'+ loser.username +'!" Log in at http://sparc-pong.herokuapp.com to crush some more feelings.', winnerLeader.email);
        }
    });
    Player.findById(winner.partner).populate('alerts').exec(function(err, winnerPartner) {
        if (err) {
            console.log(err);
        } else if (winnerPartner.email && winnerPartner.alerts.team.resolved) {
            sendEmail('Resolved Doubles Challenge', 'Congratulations on beating "'+ loser.username +'!" Log in at http://sparc-pong.herokuapp.com to crush some more feelings.', winnerPartner.email);
        }
    });
};

module.exports.forfeitedTeamChallenge = function (challenger, challengee) {
    console.log('Checking email permissions for a forfeited team challenge');
    Player.findById(challenger.leader).populate('alerts').exec(function(err, leader) {
        if (err) {
            console.log(err);
        } else if (leader.email && leader.alerts.team.forfeited) {
            sendEmail('Forfeited Doubles Challenge', 'That lil chicken of a team "'+ challengee.username +'" forfeited your challenge. You win by default!', leader.email);
        }
    });
    Player.findById(challenger.partner).populate('alerts').exec(function(err, partner) {
        if (err) {
            console.log(err);
        } else if (partner.email && partner.alerts.team.forfeited) {
            sendEmail('Forfeited Doubles Challenge', 'That lil chicken of a team "'+ challengee.username +'" forfeited your challenge. You win by default!', partner.email);
        }
    });
};


module.exports.newChallenge = function (challenger, challengee) {
    console.log('Checking email permission for a new challenge');
    Player.findById(challengee._id).populate('alerts').exec(function(err, challengee) {
        if (err) {
            console.log(err);
            return;
        }
        if (challengee.email && challengee.alerts.challenged) {
            sendEmail('New Challenge', 'You have been challenged by '+ challenger.username +'. Log in at http://sparc-pong.herokuapp.com to deal with that scrub!', challengee.email);
        }
    });
};

module.exports.revokedChallenge = function (challenger, challengee) {
    console.log('Checking email permission for a revoked challenge');
    Player.findById(challengee._id).populate('alerts').exec(function(err, challengee) {
        if (err) {
            console.log(err);
            return;
        }
        if (challengee.email && challengee.alerts.revoked) {
            sendEmail('Revoked Challenge', challenger.username +' got scared and revoked a challenge against you.', challengee.email);
        }
    });
};

module.exports.resolvedChallenge = function (winner, loser) {
    console.log('Checking email permission for a resolved challenge');
    // Contacts loser
    Player.findById(loser._id).populate('alerts').exec(function(err, loser) {
        if (err) {
            console.log(err);
            return;
        }
        if (loser.email && loser.alerts.resolved) {
            sendEmail('Resolved Challenge', 'Welp, stuff happens. It looks like '+ winner.username +' really laid the smack on ya. Log in at http://sparc-pong.herokuapp.com and pick an easier opponent.', loser.email);
        }

        // Contacts winner
        Player.findById(winner._id).populate('alerts').exec(function(err, winner) {
            if (err) {
                console.log(err);
                return;
            }
            if (winner.email && winner.alerts.resolved) {
                sendEmail('Resolved Challenge', 'Congratulations on beating '+ loser.username +'! Log in at http://sparc-pong.herokuapp.com to crush some more feelings.', winner.email);
            }
        });
    });
};

module.exports.forfeitedChallenge = function (challenger, challengee) {
    console.log('Checking email permission for a forfeited challenge');
    Player.findById(challenger).populate('alerts').exec(function(err, challenger) {
        if (err) {
            console.log(err);
            return;
        }
        if (challenger.email && challenger.alerts.forfeited) {
            sendEmail('Forfeited Challenge', 'That lil weasel, '+ challengee.username +', forfeited your challenge. You win by default!', challenger.email);
        }
    });
}


function sendEmail(subject, message, address) {
    console.log('Trying to send email to '+ address);

    var mailOptions = {
        to: address,
        from: process.env.EMAIL_TITLE +' <'+ process.env.EMAIL_ADDRESS +'>',
        subject: subject,
        text: message
    };

    transporter.sendMail(mailOptions, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log('Message sent to ' + address);
        }
    });
}