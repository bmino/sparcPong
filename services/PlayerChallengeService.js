const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Challenge = mongoose.model('Challenge');
const ChallengeService = require('./ChallengeService');
const MailerService = require('./MailerService');
const Util = require('./Util');
const SocketService = require('./SocketService');

const PlayerChallengeService = {
    ALLOWED_CHALLENGE_DAYS: process.env.ALLOWED_CHALLENGE_DAYS || 4,

    doChallenge(challengeeId, clientId) {
        if (!clientId || !challengeeId) return Promise.reject(new Error('Two players are required for a challenge.'));
        if (clientId === challengeeId) return Promise.reject(new Error('Players cannot challenge themselves.'));

        return Promise.all([
            Player.findById(clientId).exec(),
            Player.findById(challengeeId).exec()
        ])
            .then(PlayerChallengeService.verifyAllowedToChallenge)
            .then(Challenge.createByPlayers)
            .then((challenge) => {
                MailerService.newChallenge(challenge._id);
                SocketService.IO.sockets.emit('challenge:issued');
                return challenge;
            });
    },

    doForfeit(challengeId, clientId) {
        return Challenge.findById(challengeId).exec()
            .then((challenge) => {
                if (!challenge) return Promise.reject(new Error('Could not find the challenge.'));
                return ChallengeService.verifyChallengeeByPlayerId(challenge, clientId, 'Only the challengee can forfeit this challenge.');
            })
            .then(ChallengeService.setForfeit)
            .then(PlayerChallengeService.updateLastGames)
            .then(ChallengeService.swapRanks)
            .then(() => {
                MailerService.forfeitedChallenge(challengeId);
                SocketService.IO.sockets.emit('challenge:forfeited');
            });
    },

    doRevoke(challengeId, clientId) {
        return Challenge.findById(challengeId).exec()
            .then((challenge) => {
                if (!challenge) return Promise.reject(new Error('Could not find the challenge.'));
                return ChallengeService.verifyChallengerByPlayerId(challenge, clientId, 'Only the challenger can revoke this challenge.');
            })
            .then(Challenge.removeByDocument)
            .then((challenge) => {
                MailerService.revokedChallenge(challenge.challenger, challenge.challengee);
                SocketService.IO.sockets.emit('challenge:revoked');
            });
    },

    doResolve(challengeId, challengerScore, challengeeScore, clientId) {
        if (!challengeId) return Promise.reject(new Error('This is not a valid challenge.'));

        return Challenge.findById(challengeId).exec()
            .then((challenge) => {
                return ChallengeService.verifyInvolvedByPlayerId(challenge, clientId, 'Only an involved player can resolve this challenge.');
            })
            .then(PlayerChallengeService.verifyForfeitIsNotRequired)
            .then((challenge) => {
                return ChallengeService.setScore(challenge, challengerScore, challengeeScore);
            })
            .then(PlayerChallengeService.updateLastGames)
            .then((challenge) => {
                if (challengerScore > challengeeScore) return ChallengeService.swapRanks(challenge);
            })
            .then(() => {
                MailerService.resolvedChallenge(challengeId);
                SocketService.IO.sockets.emit('challenge:resolved');
            });
    },

    verifyAllowedToChallenge(players) {
        let challenger = players[0];
        let challengee = players[1];

        return new Promise((resolve, reject) => {
            let activePlayerCheck = PlayerChallengeService.verifyActivePlayers(players);
            let existingChallengesCheck = PlayerChallengeService.verifyChallengesBetweenPlayers(players);
            let rankCheck = ChallengeService.verifyRank(challenger, challengee);
            let tierCheck = ChallengeService.verifyTier(challenger, challengee);
            let reissueTimeCheck = Challenge.getResolvedBetweenPlayers(players).then(ChallengeService.verifyReissueTime);
            let businessDayCheck = ChallengeService.verifyBusinessDay();

            return Promise.all([activePlayerCheck, existingChallengesCheck, rankCheck, tierCheck, reissueTimeCheck, businessDayCheck])
                .then(() => resolve(players))
                .catch(reject);
        });
    },

    verifyActivePlayers(players) {
        if (players.find(player => !player.active)) return Promise.reject(new Error('Both players must have active accounts'));
        return Promise.resolve(players);
    },

    verifyChallengesBetweenPlayers(players) {
        let challenger = players[0];
        let challengee = players[1];
        return new Promise((resolve, reject) => {

            let challengerIncoming = Challenge.count({challengee: challenger._id, winner: null}).exec();
            let challengerOutgoing = Challenge.count({challenger: challenger._id, winner: null}).exec();
            let challengeeIncoming = Challenge.count({challengee: challengee._id, winner: null}).exec();
            let challengeeOutgoing = Challenge.count({challenger: challengee._id, winner: null}).exec();
            let challengesBetween  = Challenge.getUnresolvedBetweenPlayers(players);

            return Promise.all([challengerIncoming, challengerOutgoing, challengeeIncoming, challengeeOutgoing, challengesBetween])
                .then((counts) => {
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
        return new Promise((resolve, reject) => {
            let dateIssued = challenge.createdAt;
            let expires = Util.addBusinessDays(dateIssued, PlayerChallengeService.ALLOWED_CHALLENGE_DAYS);
            if (expires < new Date()) return reject(new Error('This challenge has expired. It must be forfeited.'));
            return resolve(challenge);
        });
    },

    updateLastGames(challenge) {
        return new Promise((resolve, reject) => {
            console.log(`Updating last games for the challenge with id of [${challenge._id}]`);

            let gameTime = challenge.updatedAt;
            let challengerUpdate = Player.findByIdAndUpdate(challenge.challenger, {$set: {lastGame: gameTime}}).exec();
            let challengeeUpdate = Player.findByIdAndUpdate(challenge.challengee, {$set: {lastGame: gameTime}}).exec();

            return Promise.all([challengerUpdate, challengeeUpdate])
                .then(() => resolve(challenge))
                .catch(reject);
        });
    }
};


module.exports = PlayerChallengeService;
