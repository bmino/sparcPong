var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Challenge = mongoose.model('Challenge');
var PlayerChallengeService = require('../../services/PlayerChallengeService');
var AuthService = require('../../services/AuthService');


/**
 * Issue new challenge.
 * @param: challengeeId
 */
router.post('/', function(req, res, next) {
    var challengeeId = req.body.challengeeId;
	var clientId = AuthService.verifyToken(req.token).playerId;

	PlayerChallengeService.doChallenge(challengeeId, clientId, req)
		.then(function() {
            res.json({message: 'Challenge issued!'});
		})
		.catch(next);
});


/**
 * Get all challenges involving a player.
 */
router.get('/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	if (!playerId) return next(new Error('This is not a valid player.'));

	var resolvedChallenges = Challenge.getResolved(playerId)
		.then(Challenge.populatePlayers);

	var outgoingChallenges = Challenge.getOutgoing(playerId)
		.then(Challenge.populatePlayers);

	var incomingChallenges = Challenge.getIncoming(playerId)
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
	var challengeId = req.body.challengeId;
    var clientId = AuthService.verifyToken(req.token).playerId;

    PlayerChallengeService.doRevoke(challengeId, clientId, req)
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
	var challengeId = req.body.challengeId;
	var challengerScore = req.body.challengerScore;
	var challengeeScore = req.body.challengeeScore;
    var clientId = AuthService.verifyToken(req.token).playerId;

	PlayerChallengeService.doResolve(challengeId, challengerScore, challengeeScore, clientId, req)
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
	var challengeId = req.body.challengeId;
    var clientId = AuthService.verifyToken(req.token).playerId;

	PlayerChallengeService.doForfeit(challengeId, clientId, req)
        .then(function() {
            res.json({message: 'Challenge successfully forfeited.'});
        })
        .catch(next);
});


module.exports = router;
