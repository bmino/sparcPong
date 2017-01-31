var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Challenge = mongoose.model('Challenge');
var Player = mongoose.model('Player');
var Team = mongoose.model('Team');
var Mailer = require('../Mailer');
var Util = require('../Util');


/**
 * POST new challenge
 * @param: challengerId
 * @param: challengeeId
 */
router.post('/', function(req, res, next) {
    var challengerId = req.body.challengerId;
    var challengeeId = req.body.challengeeId;
	if (!challengerId || !challengeeId)
		return next(new Error('Two players are required for a challenge.'));
    if (challengerId == challengeeId)
        return next(new Error('Players cannot challenge themselves.'));

    // Grabs player info on both challenge participants
	var challengerPromise = Player.findById(challengerId).exec();
	var challengeePromise = Player.findById(challengeeId).exec();

	var challenger, challengee;

    Promise.all([challengerPromise, challengeePromise])
        .then(function(players) {
        	challenger = players[0];
        	challengee = players[1];
            return allowedToChallenge(challenger, challengee);
        })
		.then(function() {
            var challenge = new Challenge();
            challenge.challenger = challengerId;
            challenge.challengee = challengeeId;
            return challenge.save();
        })
		.then(function() {
            Mailer.newChallenge(challenger, challengee);
            req.app.io.sockets.emit('challenge:issued');
            res.json({message: 'Challenge issued!'});
		})
		.catch(next);
});


/**
 * GET all challenges involving a player
 * @param: playerId
 * @return: message.resolved
 * @return: message.outgoing
 * @return: message.incoming
 */
router.get('/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	if (!playerId) return next(new Error('This is not a valid player.'));

	var resolvedChallenges = Challenge.find({ $and: [
									{$or: [{'challenger': playerId}, {'challengee': playerId}]},
									{'winner': {$ne: null}}
								]})
								.populate('challenger challengee')
								.exec();
	var outgoingChallenges = Challenge.find({challenger: playerId, winner: null})
								.populate('challenger challengee')
								.exec();

	var incomingChallenges = Challenge.find({challengee: playerId, winner: null})
								.populate('challenger challengee')
								.exec();

    Promise.all([resolvedChallenges, outgoingChallenges, incomingChallenges])
        .then(function(challenges) {
            res.json({message: {resolved: challenges[0], outgoing: challenges[1], incoming: challenges[2]}});
        })
        .catch(next);

});


/**
 * DELETE wrongly issued challenge by challengerId
 * @param: challengerId
 */
router.delete('/revoke', function(req, res, next) {
	var challengerId = req.body.challengerId;
	var challengeeId = req.body.challengeeId;
	var challenger, challengee;
	
	if (!challengerId || !challengeeId)
		return next(new Error('Both players are required to revoke a challenge.'));

	Challenge.find({challenger: challengerId, challengee: challengeeId, winner: null}).populate('challenger challengee').exec()
		.then(function(challenges) {
            if (!challenges || challenges.length == 0)
                return next(new Error('Could not find the challenge.'));

            challenger = challenges[0].challenger;
            challengee = challenges[0].challengee;

            if (hasForfeit(challenges[0].createdAt))
                return next(new Error('This challenge has expired. ' + challengee.username + ' must forfeit.'));

            return Challenge.remove({challenger: challengerId, challengee: challengeeId, winner: null}).exec();
        })
		.then(function() {
            Mailer.revokedChallenge(challenger, challengee);
            req.app.io.sockets.emit('challenge:revoked');
            res.json({message: 'Successfully revoked challenge.'});
		})
		.catch(next);
});

/**
 * POST resolved challenge by adding a score and winner
 * @param: challengeId
 * @param: challengerScore
 * @param: challengeeScore
 */
router.post('/resolve', function(req, res, next) {
	var challengeId = req.body.challengeId;
	var challengerScore = req.body.challengerScore;
	var challengeeScore = req.body.challengeeScore;

	var challenge, winner, loser;
	
	if (!challengeId) {
		console.log(challengeId + ' is not a valid challenge id.');
		return next(new Error('This is not a valid challenge.'));
	}
	if (challengerScore == null || challengeeScore == null || challengerScore < 0 || challengeeScore < 0 || challengerScore + challengeeScore < 2)
		return next(new Error('You must give valid scores for both players.'));
	if (challengerScore == challengeeScore)
		return next(new Error('The final score cannot be equal.'));
	
	Challenge.findById(challengeId).populate('challenger challengee').exec()
		.then(function(c) {
			challenge = c;
            if (hasForfeit(challenge.createdAt)) {
                return next(new Error('This challenge has expired. ' + challenge.challengee.username + ' must forfeit.'));
            }

			console.log('Resolving challenge id [' + challengeId + ']');
            winner = challengerScore > challengeeScore ? challenge.challenger : challenge.challengee;
            loser = challengerScore < challengeeScore ? challenge.challenger : challenge.challengee;

            challenge.winner = winner._id;
            challenge.challengerScore = challengerScore;
            challenge.challengeeScore = challengeeScore;
            return challenge.save();
        })
		.then(function() {
			return updateLastGames(challenge);
        })
		.then(function() {
			return swapRanks(winner, loser);
        })
		.then(function() {
			return Mailer.resolvedChallenge(winner, loser);
        })
		.then(function() {
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
	var challenge = null;
	var challengeId = req.body.challengeId;
	if (!challengeId)
		return next(new Error('This is not a valid challenge id.'));
	Challenge.findById(challengeId).populate('challenger challengee').exec()
		.then(function(c) {
			challenge = c;
            console.log('Forfeiting challenge id [' + challengeId + ']');

            // Challenger wins in the event of a forfeit
            challenge.winner = challenge.challenger._id;
			return challenge.save();
        })
		.then(function() {
			return updateLastGames(challenge);
        })
		.then(function() {
			return swapRanks(challenge.challenger, challenge.challengee);
        })
		.then(function() {
			return Mailer.forfeitedChallenge(challenge.challenger, challenge.challengee);
        })
		.then(function() {
            req.app.io.sockets.emit('challenge:forfeited');
            res.json({message: 'Challenge successfully forfeited.'});
		})
		.catch(next);
});


/**
 * Determines if the given challenge issue date should be forfeited.
 * @param dateIssued - Date the challenge was issued
 * @returns boolean - True if needs to forfeit, False if not
 */
var ALLOWED_CHALLENGE_DAYS = process.env.ALLOWED_CHALLENGE_DAYS || 4;
function hasForfeit(dateIssued) {
	var expires = Util.addBusinessDays(dateIssued, ALLOWED_CHALLENGE_DAYS);
	return expires < new Date();
}


/**
 * Determines if a given player is eligible to issue challenges.
 * @param challenger
 * @param challengee
 * @returns {Promise}
 */
var ALLOWED_OUTGOING = process.env.ALLOWED_OUTGOING || 1;
var ALLOWED_INCOMING = process.env.ALLOWED_INCOMING || 1;
var CHALLENGE_ANYTIME = process.env.CHALLENGE_ANYTIME || false;
function allowedToChallenge(challenger, challengee) {
    return new Promise(function(resolve, reject) {
        if (challenger.rank < challengee.rank)
            return reject(new Error('You cannot challenger a player below your rank.'));
        else if (Math.abs(Util.getTier(challenger.rank) - Util.getTier(challengee.rank)) > 1)
            return reject(new Error('You cannot challenge a player beyond 1 tier.'));

        // Not allowed to issue challenges on weekends
        var todayDay = new Date().getDay();
        if ((todayDay == 0 || todayDay == 6) && !CHALLENGE_ANYTIME)
            return reject(new Error('You can only issue challenges on business days.'));

        var challengerIncoming = Challenge.count({challengee: challenger._id, winner: null}).exec();
        var challengerOutgoing = Challenge.count({challenger: challenger._id, winner: null}).exec();
        var challengeeIncoming = Challenge.count({challengee: challengee._id, winner: null}).exec();
        var challengeeOutgoing = Challenge.count({challenger: challengee._id, winner: null}).exec();
        var challengesBetween  = Challenge.count(
            {$or: [
                {$and: [{challenger: challenger._id}, {challengee: challengee._id}, {winner: null}]},
                {$and: [{challenger: challengee._id}, {challengee: challenger._id}, {winner: null}]}
            ]
            }).exec();

        return Promise.all([challengerIncoming, challengerOutgoing, challengeeIncoming, challengeeOutgoing, challengesBetween])
            .then(function (counts) {
                if (counts[0] >= ALLOWED_INCOMING) return reject(new Error(challenger.username + ' cannot have more than ' + ALLOWED_INCOMING + ' incoming challenges.'));
                if (counts[1] >= ALLOWED_OUTGOING) return reject(new Error(challenger.username + ' cannot have more than ' + ALLOWED_OUTGOING + ' outgoing challenges.'));
                if (counts[2] >= ALLOWED_INCOMING) return reject(new Error(challengee.username + ' cannot have more than ' + ALLOWED_INCOMING + ' incoming challenges.'));
                if (counts[3] >= ALLOWED_OUTGOING) return reject(new Error(challengee.username + ' cannot have more than ' + ALLOWED_OUTGOING + ' outgoing challenges.'));
                if (counts[4] >= 1) return reject(new Error('A challenge already exists between ' + challenger.username + ' and ' + challengee.username));

                console.log('Checking for recently resolved challenges.');

                return getResolvedChallenges(challenger, challengee);
            })
			.then(function (challenges) {
				if (!challenges || challenges.length == 0) return resolve([challenger, challengee]);

				// Get most recent challenge
				challenges.sort(function (a, b) {
					if (a.updatedAt > b.updatedAt) return -1;
					else return 1;
				});
				var CHALLENGE_BACK_DELAY_HOURS = process.env.CHALLENGE_BACK_DELAY_HOURS || 12;
				var reissueTime = Util.addHours(challenges[0].updatedAt, CHALLENGE_BACK_DELAY_HOURS);
				var canReissue = reissueTime < new Date();
				if (canReissue) {
					return resolve();
				} else {
					return reject(new Error('You must wait at least ' + CHALLENGE_BACK_DELAY_HOURS + ' hours before re-challenging the same player.'));
				}
			})
			.catch(reject);
    });
}

function getResolvedChallenges(challenger, challengee) {
	return new Promise(function(resolve, reject) {
        return Challenge.find({$or: [
            {$and: [{challenger: challenger._id}, {challengee: challengee._id}, {winner: {$ne: null}}]},
            {$and: [{challenger: challengee._id}, {challengee: challenger._id}, {winner: {$ne: null}}]}
        ]}).exec()
            .then(resolve)
            .catch(reject);
	});
}

/**
 * Verifies and adjusts rankings between a winner and a loser.
 * @param winner
 * @param loser
 * @returns {Promise}
 */
function swapRanks(winner, loser) {
	return new Promise(function(resolve, reject) {
        if (winner.rank < loser.rank) {
            console.log('Swapping rankings is not required.');
            return resolve(false);
        }
        console.log('Swapping rankings between ' + winner.username + ' and ' + loser.username);
        return setRank(winner, TEMP_RANK)
			.then(function(oldRank) {
                return setRank(loser, oldRank);
            })
			.then(function(oldRank) {
                return setRank(winner, oldRank);
            })
			.then(resolve)
			.catch(reject);
	});
}


/**
 * Manually sets the rank of a given player.
 * @param player
 * @param newRank
 * @returns {Promise}
 */
var TEMP_RANK = -1;
function setRank(player, newRank) {
	return new Promise(function(resolve, reject) {
        console.log('Changing rank of ' + player.username + ' from [' + player.rank + '] to [' + newRank + ']');
        return Player.findById(player._id).exec()
			.then(function(player) {
				player.rank = newRank;
				return player.save();
        	})
			.then(function() {
				return resolve(player.rank);
            })
			.catch(reject);
	});
}


/**
 * Updates the last game time of both players
 * @param challenge
 * @returns {Promise}
 */
function updateLastGames(challenge) {
	return new Promise(function(resolve, reject) {
		console.log("Updating last games for the challenge with id of ["+ challenge._id +"]");
        if (!challenge.challenger._id || !challenge.challengee._id) {
            console.log("This error is likely caused by not calling populate().");
            return reject(new Error('Two players were not provided.'));
        }

        var gameTime = challenge.updatedAt;
        if (!gameTime) {
            console.log("This error is likely caused by not saving the challenge first.");
            return reject(new Error('Challenge time was not updated.'));
        }

        var challengerId = challenge.challenger._id;
        var challengeeId = challenge.challengee._id;

        // Update challenger
        var challengerUpdate = Player.findByIdAndUpdate(challengerId, {$set: {lastGame: gameTime}}).exec();
        var challengeeUpdate = Player.findByIdAndUpdate(challengeeId, {$set: {lastGame: gameTime}}).exec();

        return Promise.all([challengerUpdate, challengeeUpdate])
			.then(resolve)
			.catch(reject);
	});
}


module.exports = router;
