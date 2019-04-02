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
    const { challengeeId } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!challengeeId) return next(new Error('Challengee id is required'));

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
    const { playerId } = req.params;

    if (!playerId) return next(new Error('Player id is required'));

    Promise.all([
        Challenge.getResolved(playerId).then(Challenge.populatePlayers),
        Challenge.getOutgoing(playerId).then(Challenge.populatePlayers),
        Challenge.getIncoming(playerId).then(Challenge.populatePlayers)
    ])
        .then(([resolved, outgoing, incoming]) => {
            res.json({message: {resolved, outgoing, incoming}});
        })
        .catch(next);
});


/**
 * Revoke wrongly issued challenge.
 * @param: challengeId
 */
router.delete('/revoke', (req, res, next) => {
    const { challengeId } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!challengeId) return next(new Error('Challenge id is required'));

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
    const { challengeId, challengerScore, challengeeScore } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!challengeId) return next(new Error('Challenge id is required'));
    if (challengerScore === undefined) return next(new Error('Challenger score is required'));
    if (challengeeScore === undefined) return next(new Error('Challengee score is required'));

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
    const { challengeId } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!challengeId) return next(new Error('Challenge id is required'));

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

    if (!playerId) return next(new Error('Player id is required'));

    Challenge.getResolved(playerId)
        .then((challenges) => {
            const wins = challenges.filter(challenge => challenge.winner.toString() === playerId.toString()).length;
            const losses = challenges.length - wins;
            res.json({message: {wins, losses}});
        })
        .catch(next);
});


module.exports = router;
