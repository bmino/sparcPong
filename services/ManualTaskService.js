var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var Challenge = mongoose.model('Challenge');
var PlayerChallengeService = require('./PlayerChallengeService');
var MailerService = require('./MailerService');

var ManualTaskService = {

    autoChallenge : autoChallenge,
    autoForfeit : autoForfeit,

    deactivatePlayer : deactivatePlayer

};

module.exports = ManualTaskService;


function autoChallenge(request) {
    console.log('[Manual] - Challenge task has been engaged');

    return Player.find({}).sort('rank').exec()
        .then(function(players) {
            return issueChallenges(players, players.length-1, players.length-2, request);
        });
}

function autoForfeit(request) {
    console.log('[Manual] - Forfeit task has been engaged');

    return Challenge.getAllExpired()
        .then(function(challenges) {
            console.log('[Manual] - Found ' + challenges.length + ' expired challenges');

            var forfeitPromises = [];
            challenges.forEach(function(challenge) {
                var promise = PlayerChallengeService.doForfeit(challenge._id, challenge.challengee, request);
                forfeitPromises.push(promise);
            });

            return Promise.all(forfeitPromises);
        });
}

function deactivatePlayer(playerId, request) {
    console.log('[Manual] - Deactivating player');

    return Promise.all([
        Player.findById(playerId),
        Challenge.getIncoming(playerId),
        Challenge.getOutgoing(playerId)
    ])
        .then(function(results) {
            var player = results[0];
            var incoming = results[1];
            var outgoing = results[2];
            if (!player) return Promise.reject(new Error('Could not find player'));
            if (!player.active) return Promise.reject(new Error('Player is not currently active'));
            if (incoming.length) return PlayerChallengeService.doForfeit(incoming[0]._id, playerId, request);
            if (outgoing.length) return PlayerChallengeService.doRevoke(outgoing[0]._id, playerId, request);
        })
        .then(function() {
            return Player.findByIdAndUpdate(playerId, {active: false, rank: -404}).exec();
        })
        .then(function(inactivePlayer) {
            return Player.update({rank: {$gt: inactivePlayer.rank}}, {$inc: {rank: -1}}, {multi: true}).exec();
        });
}


function issueChallenges(players, challengerIndex, challengeeIndex, req, issued) {
    if (!issued) issued = 0;

    // Done checking players
    if (challengerIndex === 0) return Promise.resolve(issued);
    // Must check next player
    if (challengeeIndex < 0) return issueChallenges(players, --challengerIndex, challengerIndex - 1, req, issued);

    console.log('[Manual] - Attempting to match ' + players[challengerIndex].username + ' vs ' + players[challengeeIndex].username);
    return PlayerChallengeService.doChallenge(players[challengeeIndex]._id, players[challengerIndex]._id, req)
        .then(function(issuedChallenge) {
            console.log('[Manual] - Challenge issued successfully');
            MailerService.newAutoChallenge(issuedChallenge._id);
            issued++;
            challengerIndex--;
            challengeeIndex = challengerIndex - 1;
        })
        .catch(function(err) {
            console.error('[Manual] - ' + err);
            challengeeIndex--;
        })
        .then(function() {
            return issueChallenges(players, challengerIndex, challengeeIndex, req, issued);
        });
}