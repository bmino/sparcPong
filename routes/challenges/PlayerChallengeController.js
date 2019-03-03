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
router.post('/', function(req, res, next) {
    let challengeeId = req.body.challengeeId;
	let clientId = AuthService.verifyToken(req.token).playerId;

	PlayerChallengeService.doChallenge(challengeeId, clientId)
		.then(function() {
            res.json({message: 'Challenge issued!'});
		})
		.catch(next);
});


/**
 * Get all challenges involving a player.
 */
router.get('/:playerId', function(req, res, next) {
	let playerId = req.params.playerId;
	if (!playerId) return next(new Error('This is not a valid player.'));

	let resolvedChallenges = Challenge.getResolved(playerId)
		.then(Challenge.populatePlayers);

	let outgoingChallenges = Challenge.getOutgoing(playerId)
		.then(Challenge.populatePlayers);

	let incomingChallenges = Challenge.getIncoming(playerId)
		.then(Challenge.populatePlayers);

    Promise.all([resolvedChallenges, outgoingChallenges, incomingChallenges])
        .then(function(challenges) {
            res.json({message: {resolved: challenges[0], outgoing: challenges[1], incoming: challenges[2]}});
        })
        .catch(next);

});


/**
 * Revoke wrongly issued challenge.
 * @param: challengeId
 */
router.delete('/revoke', function(req, res, next) {
	let challengeId = req.body.challengeId;
    let clientId = AuthService.verifyToken(req.token).playerId;

    PlayerChallengeService.doRevoke(challengeId, clientId)
		.then(function() {
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
router.post('/resolve', function(req, res, next) {
	let challengeId = req.body.challengeId;
	let challengerScore = req.body.challengerScore;
	let challengeeScore = req.body.challengeeScore;
    let clientId = AuthService.verifyToken(req.token).playerId;

	PlayerChallengeService.doResolve(challengeId, challengerScore, challengeeScore, clientId)
		.then(function() {
            res.json({message: 'Successfully resolved challenge.'});
		})
		.catch(next);
});

/**
 * Forfeits an expired challenge.
 * @param: challengeId
 */
router.post('/forfeit', function(req, res, next) {
	let challengeId = req.body.challengeId;
    let clientId = AuthService.verifyToken(req.token).playerId;

	PlayerChallengeService.doForfeit(challengeId, clientId)
        .then(function() {
            res.json({message: 'Challenge successfully forfeited.'});
        })
        .catch(next);
});


module.exports = router;
