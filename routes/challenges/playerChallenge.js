var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Challenge = mongoose.model('Challenge');
var Player = mongoose.model('Player');
var MailerService = require('../../services/MailerService');
var ChallengeService = require('../../services/ChallengeService');
var PlayerChallengeService = require('../../services/PlayerChallengeService');
var AuthService = require('../../services/AuthService');


/**
 * Issue new challenge.
 * @param: challengeeId
 */
router.post('/', function(req, res, next) {
    var challengeeId = req.body.challengeeId;
	var clientId = AuthService.verifyToken(req.token).playerId;

	if (!clientId || !challengeeId) return next(new Error('Two players are required for a challenge.'));
    if (clientId === challengeeId) return next(new Error('Players cannot challenge themselves.'));

	var challengerPromise = Player.findById(clientId).exec();
	var challengeePromise = Player.findById(challengeeId).exec();

    Promise.all([challengerPromise, challengeePromise])
        .then(PlayerChallengeService.verifyAllowedToChallenge)
		.then(Challenge.createByPlayers)
		.then(function(challenge) {
            MailerService.newChallenge(challenge._id);
            req.app.io.sockets.emit('challenge:issued');
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
		.then(function(challenges) {
			return Challenge.populate(challenges, 'challenger challengee');
		});

	var outgoingChallenges = Challenge.getOutgoing(playerId)
		.then(function(challenges) {
			return Challenge.populate(challenges, 'challenger challengee');
		});

	var incomingChallenges = Challenge.getIncoming(playerId)
		.then(function(challenges) {
			return Challenge.populate(challenges, 'challenger challengee');
		});

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

	Challenge.findById(challengeId).exec()
		.then(function(challenge) {
            if (!challenge) return Promise.reject(new Error('Could not find the challenge.'));
            return ChallengeService.verifyChallengerByPlayerId(challenge, clientId, 'Only the challenger can revoke this challenge.');
        })
		.then(ChallengeService.verifyForfeit)
		.then(Challenge.removeByDocument)
		.then(function(challenge) {
            MailerService.revokedChallenge(challenge.challenger, challenge.challengee);
            req.app.io.sockets.emit('challenge:revoked');
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
	
	if (!challengeId) return next(new Error('This is not a valid challenge.'));

	Challenge.findById(challengeId).exec()
		.then(function(challenge) {
            return ChallengeService.verifyInvolvedByPlayerId(challenge, clientId, 'Only an involved player can resolve this challenge.');
        })
		.then(ChallengeService.verifyForfeit)
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

	Challenge.findById(challengeId).exec()
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
            res.json({message: 'Challenge successfully forfeited.'});
		})
		.catch(next);
});


module.exports = router;
