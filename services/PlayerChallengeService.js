var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var Challenge = mongoose.model('Challenge');
var ChallengeService = require('./ChallengeService');

var PlayerChallengeService = {
    ALLOWED_CHALLENGE_DAYS: process.env.ALLOWED_CHALLENGE_DAYS || 4,

    verifyAllowedToChallenge : verifyAllowedToChallenge,
    verifyChallengesBetweenPlayers : verifyChallengesBetweenPlayers,
    verifyForfeitIsNotRequired : verifyForfeitIsNotRequired,

    updateLastGames : updateLastGames
};

module.exports = PlayerChallengeService;


function verifyChallengesBetweenPlayers(players) {
    var challenger = players[0];
    var challengee = players[1];
    return new Promise(function(resolve, reject) {

        var challengerIncoming = Challenge.count({challengee: challenger._id, winner: null}).exec();
        var challengerOutgoing = Challenge.count({challenger: challenger._id, winner: null}).exec();
        var challengeeIncoming = Challenge.count({challengee: challengee._id, winner: null}).exec();
        var challengeeOutgoing = Challenge.count({challenger: challengee._id, winner: null}).exec();
        var challengesBetween  = Challenge.getUnresolvedBetweenPlayers(players);

        return Promise.all([challengerIncoming, challengerOutgoing, challengeeIncoming, challengeeOutgoing, challengesBetween])
            .then(function (counts) {
                if (counts[0] >= ChallengeService.ALLOWED_INCOMING) return reject(new Error(challenger.username + ' cannot have more than ' + ChallengeService.ALLOWED_INCOMING + ' incoming challenges.'));
                if (counts[1] >= ChallengeService.ALLOWED_OUTGOING) return reject(new Error(challenger.username + ' cannot have more than ' + ChallengeService.ALLOWED_OUTGOING + ' outgoing challenges.'));
                if (counts[2] >= ChallengeService.ALLOWED_INCOMING) return reject(new Error(challengee.username + ' cannot have more than ' + ChallengeService.ALLOWED_INCOMING + ' incoming challenges.'));
                if (counts[3] >= ChallengeService.ALLOWED_OUTGOING) return reject(new Error(challengee.username + ' cannot have more than ' + ChallengeService.ALLOWED_OUTGOING + ' outgoing challenges.'));
                if (counts[4].length >= 1) return reject(new Error('A challenge already exists between ' + challenger.username + ' and ' + challengee.username));

                return resolve(players);
            })
            .then(resolve)
            .catch(reject);
    });
}

function verifyAllowedToChallenge(players) {
    var challenger = players[0];
    var challengee = players[1];

    return new Promise(function(resolve, reject) {
        var existingChallengesCheck = PlayerChallengeService.verifyChallengesBetweenPlayers(players);
        var rankCheck = ChallengeService.verifyRank(challenger, challengee);
        var tierCheck = ChallengeService.verifyTier(challenger, challengee);
        var reissueTimeCheck = Challenge.getResolvedBetweenPlayers(players).then(ChallengeService.verifyReissueTime);
        var businessDayCheck = ChallengeService.verifyBusinessDay();

        return Promise.all([existingChallengesCheck, rankCheck, tierCheck, reissueTimeCheck, businessDayCheck])
            .then(function() {return resolve(players);})
            .catch(reject);
    });
}

function verifyForfeitIsNotRequired(challenge) {
    console.log('Verifying player challenge forfeit');
    return new Promise(function(resolve, reject) {
        var dateIssued = challenge.createdAt;
        var expires = Util.addBusinessDays(dateIssued, PlayerChallengeService.ALLOWED_CHALLENGE_DAYS);
        if (expires < new Date()) return reject(new Error('This challenge has expired. It must be forfeited.'));
        return resolve(challenge);
    });
}

function updateLastGames(challenge) {
    return new Promise(function(resolve, reject) {
        console.log('Updating last games for the challenge with id of ['+ challenge._id +']');

        var gameTime = challenge.updatedAt;
        var challengerUpdate = Player.findByIdAndUpdate(challenge.challenger, {$set: {lastGame: gameTime}});
        var challengeeUpdate = Player.findByIdAndUpdate(challenge.challengee, {$set: {lastGame: gameTime}});

        return Promise.all([challengerUpdate, challengeeUpdate])
            .then(function() {return resolve(challenge);})
            .catch(reject);
    });
}

