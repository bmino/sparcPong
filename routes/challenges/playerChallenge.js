var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Challenge = mongoose.model('Challenge');
var Player = mongoose.model('Player');
var MailerService = require('../../services/MailerService');
var ChallengeService = require('../../services/ChallengeService');
var PlayerChallengeService = require('../../services/PlayerChallengeService');

/**
 * Issue new challenge.
 * @param: challengerId
 * @param: challengeeId
 */
router.post('/', function(req, res, next) {
    var challengerId = req.body.challengerId;
    var challengeeId = req.body.challengeeId;

	if (!challengerId || !challengeeId) return next(new Error('Two players are required for a challenge.'));
    if (challengerId === challengeeId) return next(new Error('Players cannot challenge themselves.'));

	var challengerPromise = Player.findById(challengerId).exec();
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
 * @param: playerId
 * @return: message.resolved
 * @return: message.outgoing
 * @return: message.incoming
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
 * @param: challengerId
 * @param: challengeeId
 */
router.delete('/revoke', function(req, res, next) {
	var challengerId = req.body.challengerId;
	var challengeeId = req.body.challengeeId;
	var challengeId = null;
	
	if (!challengerId || !challengeeId) return next(new Error('Both players are required to revoke a challenge.'));

	Challenge.findOne({challenger: challengerId, challengee: challengeeId, winner: null}).exec()
		.then(function(challenge) {
            if (!challenge) return next(new Error('Could not find the challenge.'));
            challengeId = challenge._id;
            return ChallengeService.verifyForfeit(challenge);
        })
		.then(function() {
            MailerService.revokedChallenge(challengeId);
            Challenge.findByIdAndRemove(challengeId).exec();
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
	
	if (!challengeId) return next(new Error('This is not a valid challenge.'));

	Challenge.findById(challengeId).exec()
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
	if (!challengeId) return next(new Error('This is not a valid challenge id.'));

	Challenge.findById(challengeId).exec()
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
