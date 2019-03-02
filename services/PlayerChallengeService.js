const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Challenge = mongoose.model('Challenge');
const ChallengeService = require('./ChallengeService');
const MailerService = require('./MailerService');
const Util = require('./Util');

const PlayerChallengeService = {
    ALLOWED_CHALLENGE_DAYS: process.env.ALLOWED_CHALLENGE_DAYS || 4,

    doChallenge(challengeeId, clientId, req) {
        if (!clientId || !challengeeId) return Promise.reject(new Error('Two players are required for a challenge.'));
        if (clientId === challengeeId) return Promise.reject(new Error('Players cannot challenge themselves.'));

        return Promise.all([
            Player.findById(clientId).exec(),
            Player.findById(challengeeId).exec()
        ])
            .then(PlayerChallengeService.verifyAllowedToChallenge)
            .then(Challenge.createByPlayers)
            .then(function(challenge) {
                MailerService.newChallenge(challenge._id);
                req.app.io.sockets.emit('challenge:issued');
                return challenge;
            });
    },

    doForfeit(challengeId, clientId, req) {
        return Challenge.findById(challengeId).exec()
            .then(function(challenge) {
                if (!challenge) return Promise.reject(new Error('Could not find the challenge.'));
                return ChallengeService.verifyChallengeeByPlayerId(challenge, clientId, 'Only the challengee can forfeit this challenge.');
            })
            .then(ChallengeService.setForfeit)
            .then(PlayerChallengeService.updateLastGames)
            .then(ChallengeService.swapRanks)
            .then(function() {
                MailerService.forfeitedChallenge(challengeId);
                req.app.io.sockets.emit('challenge:forfeited');
            });
    },

    doRevoke(challengeId, clientId, req) {
        return Challenge.findById(challengeId).exec()
            .then(function(challenge) {
                if (!challenge) return Promise.reject(new Error('Could not find the challenge.'));
                return ChallengeService.verifyChallengerByPlayerId(challenge, clientId, 'Only the challenger can revoke this challenge.');
            })
            .then(Challenge.removeByDocument)
            .then(function(challenge) {
                MailerService.revokedChallenge(challenge.challenger, challenge.challengee);
                req.app.io.sockets.emit('challenge:revoked');
            });
    },

    doResolve(challengeId, challengerScore, challengeeScore, clientId, req) {
        if (!challengeId) return Promise.reject(new Error('This is not a valid challenge.'));

        return Challenge.findById(challengeId).exec()
            .then(function(challenge) {
                return ChallengeService.verifyInvolvedByPlayerId(challenge, clientId, 'Only an involved player can resolve this challenge.');
            })
            .then(PlayerChallengeService.verifyForfeitIsNotRequired)
            .then(function(challenge) {
                return ChallengeService.setScore(challenge, challengerScore, challengeeScore);
            })
            .then(PlayerChallengeService.updateLastGames)
            .then(function(challenge) {
                if (challengerScore > challengeeScore) return ChallengeService.swapRanks(challenge);
            })
            .then(function() {
                MailerService.resolvedChallenge(challengeId);
                req.app.io.sockets.emit('challenge:resolved');
            });
    },

    verifyAllowedToChallenge(players) {
        let challenger = players[0];
        let challengee = players[1];

        return new Promise(function(resolve, reject) {
            if (!challenger.active || !challengee.active) return reject(new Error('Both players must have active accounts'));
            let existingChallengesCheck = PlayerChallengeService.verifyChallengesBetweenPlayers(players);
            let rankCheck = ChallengeService.verifyRank(challenger, challengee);
            let tierCheck = ChallengeService.verifyTier(challenger, challengee);
            let reissueTimeCheck = Challenge.getResolvedBetweenPlayers(players).then(ChallengeService.verifyReissueTime);
            let businessDayCheck = ChallengeService.verifyBusinessDay();

            return Promise.all([existingChallengesCheck, rankCheck, tierCheck, reissueTimeCheck, businessDayCheck])
                .then(function() {return resolve(players);})
                .catch(reject);
        });
    },

    verifyChallengesBetweenPlayers(players) {
        let challenger = players[0];
        let challengee = players[1];
        return new Promise(function(resolve, reject) {

            let challengerIncoming = Challenge.count({challengee: challenger._id, winner: null}).exec();
            let challengerOutgoing = Challenge.count({challenger: challenger._id, winner: null}).exec();
            let challengeeIncoming = Challenge.count({challengee: challengee._id, winner: null}).exec();
            let challengeeOutgoing = Challenge.count({challenger: challengee._id, winner: null}).exec();
            let challengesBetween  = Challenge.getUnresolvedBetweenPlayers(players);

            return Promise.all([challengerIncoming, challengerOutgoing, challengeeIncoming, challengeeOutgoing, challengesBetween])
                .then(function (counts) {
                    if (counts[0] >= ChallengeService.ALLOWED_INCOMING) return reject(new Error(`${challenger.username} cannot have more than ${ChallengeService.ALLOWED_INCOMING} incoming challenges.`));
                    if (counts[1] >= ChallengeService.ALLOWED_OUTGOING) return reject(new Error(`${challenger.username} cannot have more than ${ChallengeService.ALLOWED_OUTGOING} outgoing challenges.`));
                    if (counts[2] >= ChallengeService.ALLOWED_INCOMING) return reject(new Error(`${challengee.username} cannot have more than ${ChallengeService.ALLOWED_INCOMING} incoming challenges.`));
                    if (counts[3] >= ChallengeService.ALLOWED_OUTGOING) return reject(new Error(`${challengee.username} cannot have more than ${ChallengeService.ALLOWED_OUTGOING} outgoing challenges.`));
                    if (counts[4].length >= 1) return reject(new Error(`A challenge already exists between ${challenger.username} and ${challengee.username}`));

                    return resolve(players);
                })
                .then(resolve)
                .catch(reject);
        });
    },

    verifyForfeitIsNotRequired(challenge) {
        console.log('Verifying player challenge forfeit');
        return new Promise(function(resolve, reject) {
            let dateIssued = challenge.createdAt;
            let expires = Util.addBusinessDays(dateIssued, PlayerChallengeService.ALLOWED_CHALLENGE_DAYS);
            if (expires < new Date()) return reject(new Error('This challenge has expired. It must be forfeited.'));
            return resolve(challenge);
        });
    },

    updateLastGames(challenge) {
        return new Promise(function(resolve, reject) {
            console.log(`Updating last games for the challenge with id of [${challenge._id}]`);

            let gameTime = challenge.updatedAt;
            let challengerUpdate = Player.findByIdAndUpdate(challenge.challenger, {$set: {lastGame: gameTime}}).exec();
            let challengeeUpdate = Player.findByIdAndUpdate(challenge.challengee, {$set: {lastGame: gameTime}}).exec();

            return Promise.all([challengerUpdate, challengeeUpdate])
                .then(function() {return resolve(challenge);})
                .catch(reject);
        });
    }
};


module.exports = PlayerChallengeService;
