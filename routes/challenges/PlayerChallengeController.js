const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Challenge = mongoose.model('Challenge');
const PlayerChallengeService = require('../../services/PlayerChallengeService');
const AuthService = require('../../services/AuthService');


/**
 * Issue new challenge.
 * @param: challengeeId
 */
router.post('/', (req, res, next) => {
    let challengeeId = req.body.challengeeId;
    let clientId = AuthService.verifyToken(req.token).playerId;

    PlayerChallengeService.doChallenge(challengeeId, clientId)
        .then(() => {
            res.json({message: 'Challenge issued!'});
        })
        .catch(next);
});


/**
 * Get all challenges involving a player.
 */
router.get('/:playerId', (req, res, next) => {
    let playerId = req.params.playerId;
    if (!playerId) return next(new Error('This is not a valid player'));

    let resolvedChallenges = Challenge.getResolved(playerId)
        .then(Challenge.populatePlayers);

    let outgoingChallenges = Challenge.getOutgoing(playerId)
        .then(Challenge.populatePlayers);

    let incomingChallenges = Challenge.getIncoming(playerId)
        .then(Challenge.populatePlayers);

    Promise.all([resolvedChallenges, outgoingChallenges, incomingChallenges])
        .then((challenges) => {
            res.json({message: {resolved: challenges[0], outgoing: challenges[1], incoming: challenges[2]}});
        })
        .catch(next);

});


/**
 * Revoke wrongly issued challenge.
 * @param: challengeId
 */
router.delete('/revoke', (req, res, next) => {
    let challengeId = req.body.challengeId;
    let clientId = AuthService.verifyToken(req.token).playerId;

    PlayerChallengeService.doRevoke(challengeId, clientId)
        .then(() => {
            res.json({message: 'Successfully revoked challenge.'});
        })
        .catch(next);
});

/**
 * Resolve challenge by adding a score and winner.
 * @param: challengeId
 * @param: challengerScore
 * @param: challengeeScore
 */
router.post('/resolve', (req, res, next) => {
    let challengeId = req.body.challengeId;
    let challengerScore = req.body.challengerScore;
    let challengeeScore = req.body.challengeeScore;
    let clientId = AuthService.verifyToken(req.token).playerId;

    PlayerChallengeService.doResolve(challengeId, challengerScore, challengeeScore, clientId)
        .then(() => {
            res.json({message: 'Successfully resolved challenge.'});
        })
        .catch(next);
});

/**
 * Forfeits an expired challenge.
 * @param: challengeId
 */
router.post('/forfeit', (req, res, next) => {
    let challengeId = req.body.challengeId;
    let clientId = AuthService.verifyToken(req.token).playerId;

    PlayerChallengeService.doForfeit(challengeId, clientId)
        .then(() => {
            res.json({message: 'Challenge successfully forfeited.'});
        })
        .catch(next);
});


/**
 * Get the wins and losses for a player
 * @param: playerId
 */
router.get('/record/:playerId', (req, res, next) => {
    const { playerId } = req.params;

    if (!playerId) return next(new Error('You must specify a player id'));

    Challenge.getResolved(playerId)
        .then((challenges) => {
            const wins = challenges.filter(challenge => challenge.winner.toString() === playerId.toString()).length;
            const losses = challenges.length - wins;
            res.json({message: {wins: wins, losses: losses}});
        })
        .catch(next);
});


module.exports = router;
