var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var TeamChallenge = mongoose.model('TeamChallenge');
var ChallengeService = require('./ChallengeService');

var TeamChallengeService = {
    ALLOWED_CHALLENGE_DAYS_TEAM: process.env.ALLOWED_CHALLENGE_DAYS_TEAM || 5,

    verifyAllowedToChallenge : verifyAllowedToChallenge,
    verifyChallengesBetweenTeams : verifyChallengesBetweenTeams,
    verifyAllowedToResolve : verifyAllowedToResolve,
    verifyAllowedToForfeit : verifyAllowedToForfeit,
    verifyAllowedToRevoke : verifyAllowedToRevoke,
    verifyForfeitIsNotRequired : verifyForfeitIsNotRequired,

    updateLastGames : updateLastGames
};

module.exports = TeamChallengeService;


function verifyChallengesBetweenTeams(teams) {
    var challenger = teams[0];
    var challengee = teams[1];
    return new Promise(function(resolve, reject) {

        var challengerIncoming = TeamChallenge.count({challengee: challenger._id, winner: null}).exec();
        var challengerOutgoing = TeamChallenge.count({challenger: challenger._id, winner: null}).exec();
        var challengeeIncoming = TeamChallenge.count({challengee: challengee._id, winner: null}).exec();
        var challengeeOutgoing = TeamChallenge.count({challenger: challengee._id, winner: null}).exec();
        var challengesBetween  = TeamChallenge.getUnresolvedBetweenTeams(teams);

        return Promise.all([challengerIncoming, challengerOutgoing, challengeeIncoming, challengeeOutgoing, challengesBetween])
            .then(function (counts) {
                if (counts[0] >= ChallengeService.ALLOWED_INCOMING) return reject(new Error(challenger.username + ' cannot have more than ' + ChallengeService.ALLOWED_INCOMING + ' incoming challenges.'));
                if (counts[1] >= ChallengeService.ALLOWED_OUTGOING) return reject(new Error(challenger.username + ' cannot have more than ' + ChallengeService.ALLOWED_OUTGOING + ' outgoing challenges.'));
                if (counts[2] >= ChallengeService.ALLOWED_INCOMING) return reject(new Error(challengee.username + ' cannot have more than ' + ChallengeService.ALLOWED_INCOMING + ' incoming challenges.'));
                if (counts[3] >= ChallengeService.ALLOWED_OUTGOING) return reject(new Error(challengee.username + ' cannot have more than ' + ChallengeService.ALLOWED_OUTGOING + ' outgoing challenges.'));
                if (counts[4].length >= 1) return reject(new Error('A challenge already exists between ' + challenger.username + ' and ' + challengee.username));

                return resolve(teams);
            })
            .then(resolve)
            .catch(reject);
    });
}

function verifyAllowedToChallenge(teams) {
    var challenger = teams[0];
    var challengee = teams[1];
    return new Promise(function(resolve, reject) {

        var existingChallengesCheck = TeamChallengeService.verifyChallengesBetweenTeams(teams);
        var rankCheck = ChallengeService.verifyRank(challenger, challengee);
        var tierCheck = ChallengeService.verifyTier(challenger, challengee);
        var reissueTimeCheck = TeamChallenge.getResolvedBetweenTeams(teams).then(ChallengeService.verifyReissueTime);
        var businessDayCheck = ChallengeService.verifyBusinessDay();

        return Promise.all([existingChallengesCheck, rankCheck, tierCheck, reissueTimeCheck, businessDayCheck])
            .then(function() {return resolve(teams);})
            .catch(reject);
    });
}

function verifyAllowedToResolve(teamChallenge, playerId) {
    return new Promise(function(resolve, reject) {
        TeamChallenge.populate(teamChallenge, 'challenger challengee')
            .then(function(populatedTeamChallenge) {
                if (populatedTeamChallenge.challenger.hasMemberByPlayerId(playerId)) {
                    return resolve(teamChallenge);
                }
                if (populatedTeamChallenge.challengee.hasMemberByPlayerId(playerId)) {
                    return resolve(teamChallenge);
                }
                return reject(new Error('Only players involved in the challenge can resolve it.'));
            })
            .catch(reject);
    });
}

function verifyAllowedToForfeit(teamChallenge, playerId) {
    return new Promise(function(resolve, reject) {
        TeamChallenge.populate(teamChallenge, 'challengee')
            .then(function(populatedTeamChallenge) {
                if (populatedTeamChallenge.challengee.hasMemberByPlayerId(playerId)) {
                    return resolve(teamChallenge);
                }
                return reject(new Error('Only the challengee can forfeit a challenge.'));
            })
            .catch(reject);
    });
}

function verifyAllowedToRevoke(teamChallenge, playerId) {
    return new Promise(function(resolve, reject) {
        TeamChallenge.populate(teamChallenge, 'challenger')
            .then(function(populatedTeamChallenge) {
                if (populatedTeamChallenge.challenger.hasMemberByPlayerId(playerId)) {
                    return resolve(teamChallenge);
                }
                return reject(new Error('Only the challenger can revoke a challenge.'));
            })
            .catch(reject);
    });
}

function verifyForfeitIsNotRequired(challenge) {
    console.log('Verifying team challenge forfeit');
    return new Promise(function(resolve, reject) {
        var dateIssued = challenge.createdAt;
        var expires = Util.addBusinessDays(dateIssued, TeamChallengeService.ALLOWED_CHALLENGE_DAYS_TEAM);
        if (expires < new Date()) return reject(new Error('This challenge has expired. It must be forfeited.'));
        return resolve(challenge);
    });
}

function updateLastGames(challenge) {
    console.log("Updating last games for the challenge with id of ["+ challenge._id +"]");
    return new Promise(function(resolve, reject) {
        return TeamChallenge.populateById(challenge._id)
            .then(function(c) {
                var setTimeOption = {$set: {lastGame: c.updatedAt}};
                var challengerLeaderUpdate = Player.findByIdAndUpdate(c.challenger.leader._id, setTimeOption).exec();
                var challengerPartnerUpdate = Player.findByIdAndUpdate(c.challenger.partner._id, setTimeOption).exec();
                var challengeeLeaderUpdate = Player.findByIdAndUpdate(c.challengee.leader._id, setTimeOption).exec();
                var challengeePartnerUpdate = Player.findByIdAndUpdate(c.challengee.partner._id, setTimeOption).exec();

                return Promise.all([challengerLeaderUpdate, challengerPartnerUpdate, challengeeLeaderUpdate, challengeePartnerUpdate])
                    .then(function() {return resolve(challenge);})
                    .catch(reject);
            });

    });
}
