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
        if (!clientId || !challengeeId) return Promise.reject(new Error('Two players are required for a challenge'));
        if (clientId === challengeeId) return Promise.reject(new Error('Players cannot challenge themselves'));

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
                if (!challenge) return Promise.reject(new Error('Invalid challenge id'));
                return ChallengeService.verifyChallengeeByPlayerId(challenge, clientId, 'Only the challengee can forfeit this challenge');
            })
            .then(ChallengeService.verifyChallengeIsUnresolved)
            .then(ChallengeService.setForfeit)
            .then(ChallengeService.swapRanks)
            .then(() => {
                MailerService.forfeitedChallenge(challengeId);
                SocketService.IO.sockets.emit('challenge:forfeited');
            });
    },

    doRevoke(challengeId, clientId) {
        return Challenge.findById(challengeId).exec()
            .then((challenge) => {
                if (!challenge) return Promise.reject(new Error('Invalid challenge id'));
                return ChallengeService.verifyChallengerByPlayerId(challenge, clientId, 'Only the challenger can revoke this challenge');
            })
            .then(ChallengeService.verifyChallengeIsUnresolved)
            .then(Challenge.removeByDocument)
            .then((challenge) => {
                MailerService.revokedChallenge(challenge.challenger, challenge.challengee);
                SocketService.IO.sockets.emit('challenge:revoked');
            });
    },

    doResolve(challengeId, challengerScore, challengeeScore, clientId) {
        return Challenge.findById(challengeId).exec()
            .then((challenge) => {
                if (!challenge) return Promise.reject(new Error('Invalid challenge id'));
                return ChallengeService.verifyInvolvedByPlayerId(challenge, clientId, 'Only an involved player can resolve this challenge');
            })
            .then(PlayerChallengeService.verifyForfeitIsNotRequired)
            .then((challenge) => ChallengeService.setScore(challenge, challengerScore, challengeeScore))
            .then((challenge) => {
                if (challengerScore > challengeeScore) return ChallengeService.swapRanks(challenge);
            })
            .then(() => {
                MailerService.resolvedChallenge(challengeId);
                SocketService.IO.sockets.emit('challenge:resolved');
            });
    },

    verifyAllowedToChallenge(players) {
        const [challenger, challengee] = players;

        return Promise.all([
            PlayerChallengeService.verifyActivePlayers(players),
            PlayerChallengeService.verifyChallengesBetweenPlayers(players),
            ChallengeService.verifyRank(challenger, challengee),
            ChallengeService.verifyTier(challenger, challengee),
            Challenge.getResolvedBetweenPlayers(players).then(ChallengeService.verifyReissueTime)
        ])
            .then(() => players);
    },

    verifyActivePlayers(players) {
        if (players.find(player => !player.active)) return Promise.reject(new Error('Both players must have active accounts'));
        return Promise.resolve(players);
    },

    verifyChallengesBetweenPlayers(players) {
        const [challenger, challengee] = players;

        return Promise.all([
            Challenge.countDocuments({challengee: challenger._id, winner: null}).exec(),
            Challenge.countDocuments({challenger: challenger._id, winner: null}).exec(),
            Challenge.countDocuments({challengee: challengee._id, winner: null}).exec(),
            Challenge.countDocuments({challenger: challengee._id, winner: null}).exec(),
            Challenge.getUnresolvedBetweenPlayers(players)
        ])
            .then(([challengerIncoming, challengerOutgoing, challengeeIncoming, challengeeOutgoing, challengesBetween]) => {
                if (challengerIncoming >= ChallengeService.ALLOWED_INCOMING) return Promise.reject(new Error(`${challenger.username} cannot have more than ${ChallengeService.ALLOWED_INCOMING} incoming challenges`));
                if (challengerOutgoing >= ChallengeService.ALLOWED_OUTGOING) return Promise.reject(new Error(`${challenger.username} cannot have more than ${ChallengeService.ALLOWED_OUTGOING} outgoing challenges`));
                if (challengeeIncoming >= ChallengeService.ALLOWED_INCOMING) return Promise.reject(new Error(`${challengee.username} cannot have more than ${ChallengeService.ALLOWED_INCOMING} incoming challenges`));
                if (challengeeOutgoing >= ChallengeService.ALLOWED_OUTGOING) return Promise.reject(new Error(`${challengee.username} cannot have more than ${ChallengeService.ALLOWED_OUTGOING} outgoing challenges`));
                if (challengesBetween.length >= 1) return Promise.reject(new Error(`A challenge already exists between ${challenger.username} and ${challengee.username}`));
            })
            .then(() => players);
    },

    verifyForfeitIsNotRequired(challenge) {
        console.log('Verifying player challenge forfeit');

        const expires = Util.addBusinessDays(challenge.createdAt, PlayerChallengeService.ALLOWED_CHALLENGE_DAYS);
        if (expires < new Date()) return Promise.reject(new Error('This challenge has expired and must be forfeited'));
        return Promise.resolve(challenge);
    }

};


module.exports = PlayerChallengeService;
