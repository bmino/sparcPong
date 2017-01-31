var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var TeamChallenge = mongoose.model('TeamChallenge');
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
	var challenger, challengee;
	
	if (!challengerId || !challengeeId)
		return next(new Error('Two teams are required for a challenge.'));
	if (challengerId == challengeeId)
		return next(new Error('Teams cannot challenge themselves.'));
	
	// Not allowed to issue challenges on weekends
	var todayDay = new Date().getDay();
	var CHALLENGE_ANYTIME = process.env.CHALLENGE_ANYTIME || false;
	if ((todayDay == 0 || todayDay == 6) && !CHALLENGE_ANYTIME)
		return next(new Error('You can only issue challenges on business days.'));

	// Grabs team info on both challenge participants
	var challengerPromise = Team.findById(challengerId).exec();
	var challengeePromise =	Team.findById(challengeeId).exec();

	Promise.all([challengerPromise, challengeePromise])
		.then(function(teams) {
            return allowedToChallenge(teams[0], teams[1]);
        })
		.then(function(teams) {
			challenger = teams[0];
			challengee = teams[1];
			var challenge = new TeamChallenge();
			challenge.challenger = challengerId;
			challenge.challengee = challengeeId;
			return challenge.save();
		})
		.then(function() {
			return Mailer.newTeamChallenge(challenger, challengee);
		})
		.then(function() {
            req.app.io.sockets.emit('challenge:team:issued');
            res.json({message: 'Challenge issued!'});
		})
		.catch(next);
});


/**
 * GET all challenges involving a team
 * @param: teamId
 * @return: message.resolved
 * @return: message.outgoing
 * @return: message.incoming
 */
router.get('/:teamId', function(req, res, next) {
	var teamId = req.params.teamId;
	if (!teamId) {
		console.log(teamId + ' is not a valid team id.');
		return next(new Error('This is not a valid team.'));
	}

	var resolvedChallenges = TeamChallenge.find({ $and: [
								{$or: [{'challenger': teamId}, {'challengee': teamId}]},
								{'winner': {$ne: null}}
							]})
							.populate('challenger challengee')
							.exec();

	var outgoingChallenges = TeamChallenge.find({challenger: teamId, winner: null})
							.populate({
								path: 'challenger challengee',
								populate: {path: 'leader partner'}
							})
							.exec();

	var incomingChallenges = TeamChallenge.find({challengee: teamId, winner: null})
							.populate({
								path: 'challenger challengee',
								populate: {path: 'leader partner'}
							})
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
	var challenges, challenger, challengee;
	
	if (!challengerId || !challengeeId)
		return next(new Error('Both teams must be provided to revoke a challenge.'));
	
	// Checks for forfeit
	TeamChallenge.find({challenger: challengerId, challengee: challengeeId, winner: null})
	.populate('challenger challengee').exec()
		.then(function(c) {
			challenges = c;
            if (!challenges || challenges.length == 0) return next(new Error('Could not find the challenge.'));

            challenger = challenges[0].challenger;
            challengee = challenges[0].challengee;

            if (hasForfeit(challenges[0].createdAt))
                return next(new Error('This challenge has expired. ' + challengee.username + ' must forfeit.'));

            return TeamChallenge.remove({challenger: challengerId, challengee: challengeeId, winner: null}).exec();
        })
		.then(function() {
            return Mailer.revokedTeamChallenge(challenger, challengee);
		})
		.then(function() {
            req.app.io.sockets.emit('challenge:team:revoked');
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

	TeamChallenge.findById(challengeId).populate('challenger challengee').exec()
		.then(function(c) {
			challenge = c;
            if (hasForfeit(challenge.createdAt))
                return next(new Error('This challenge has expired. ' + challenge.challengee.username + ' must forfeit.'));

            console.log('Resolving challenge id [' + challengeId + ']');
            winner = challengerScore > challengeeScore ? challenge.challenger : challenge.challengee;
            loser = challengerScore < challengeeScore ? challenge.challenger : challenge.challengee;
            return concludeChallenge(challenge, winner, challengerScore, challengeeScore);
        })
		.then(function() {
            return Mailer.resolvedTeamChallenge(winner, loser);
		})
		.then(function() {
			req.app.io.sockets.emit('challenge:team:resolved');
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
	var challenge;
	TeamChallenge.findById(challengeId).populate('challenger challengee').exec()
		.then(function(c) {
			challenge = c;
            console.log('Forfeiting challenge id [' + challengeId + ']');
            var winner = challenge.challenger;
            return concludeChallenge(challenge, winner);
        })
		.then(function() {
			return Mailer.forfeitedTeamChallenge(challenge.challenger, challenge.challengee);
		})
		.then(function() {
			req.app.io.sockets.emit('challenge:team:forfeited');
			res.json({message: 'Challenge successfully forfeited.'});
		})
		.catch(next);
});


/**
 * Determines if the given challenge issue date should be forfeited.
 * @param dateIssued
 * @returns {boolean}
 */
var ALLOWED_CHALLENGE_DAYS_TEAM = process.env.ALLOWED_CHALLENGE_DAYS_TEAM || 5;
function hasForfeit(dateIssued) {
	var expires = Util.addBusinessDays(dateIssued, ALLOWED_CHALLENGE_DAYS_TEAM);
	return expires < new Date();
}

/**
 * Determines if two teams are allowed to challenge each other.
 * @param challenger
 * @param challengee
 * @returns {Promise} - Resolves if allowed
 */
var ALLOWED_OUTGOING = process.env.ALLOWED_OUTGOING || 1;
var ALLOWED_INCOMING = process.env.ALLOWED_INCOMING || 1;
function allowedToChallenge(challenger, challengee) {
	return new Promise(function(resolve, reject) {
        if (challenger.rank < challengee.rank)
            return reject(new Error('You cannot challenger a team below your rank.'));
        else if (Math.abs(Util.getTier(challenger.rank) - Util.getTier(challengee.rank)) > 1)
            return reject(new Error('You cannot challenge a team beyond 1 tier.'));

        var challengerIncoming = TeamChallenge.count({challengee: challenger._id, winner: null}).exec();
        var challengerOutgoing = TeamChallenge.count({challenger: challenger._id, winner: null}).exec();
        var challengeeIncoming = TeamChallenge.count({challengee: challengee._id, winner: null}).exec();
        var challengeeOutgoing = TeamChallenge.count({challenger: challengee._id, winner: null}).exec();
        var challengesBetween  = TeamChallenge.count(
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
					return resolve([challenger, challengee]);
				} else {
					return reject(new Error('You must wait at least ' + CHALLENGE_BACK_DELAY_HOURS + ' hours before re-challenging the same team.'));
				}
			})
			.catch(reject);
    });
}

/**
 * Returns a list of resolved challenges between two teams.
 * @param challenger
 * @param challengee
 * @returns {Promise} - List of resolved challenges
 */
function getResolvedChallenges(challenger, challengee) {
	return new Promise(function(resolve, reject) {
        return TeamChallenge.find({$or: [
            {$and: [{challenger: challenger._id}, {challengee: challengee._id}, {winner: {$ne: null}}]},
            {$and: [{challenger: challengee._id}, {challengee: challenger._id}, {winner: {$ne: null}}]}
        ]}).exec()
			.then(resolve)
			.catch(reject);
	});
}

/**
 * Swaps the rankings for two given teams.
 * @param winner
 * @param loser
 * @returns {Promise}
 */
function swapRanks(winner, loser) {
	return new Promise(function(resolve, reject) {
		console.log('Winner ' + winner.username + ' has rank of [' + winner.rank + ']');
		console.log('Loser ' + loser.username + ' has rank of [' + loser.rank + ']');
        if (winner.rank < loser.rank) {
            console.log('Swapping rankings is not required.');
            return resolve();
        }
        console.log('Swapping rankings between ' + winner.username + ' and ' + loser.username);
		var setLoserRank = setRank(loser, winner.rank);
		var setWinnerRank = setRank(winner, loser.rank);
		return Promise.all([setLoserRank, setWinnerRank])
			.then(resolve)
			.catch(reject);
	});
}


/**
 * Manually sets the rank of a given team.
 * @param team
 * @param newRank
 * @returns {Promise}
 */
function setRank(team, newRank) {
	return new Promise(function(resolve, reject) {
		console.log('Changing rank of ' + team.username + ' from [' + team.rank + '] to [' + newRank + ']');
        return Team.findById(team._id).exec()
			.then(function(team) {
                team.rank = newRank;
                return team.save();
            })
			.then(function() {
				return resolve(team.rank);
            })
			.catch(reject);
	});
}


/**
 * Updates the last game time of both teams and assigns the challenge winner.
 * @param challenge
 * @param winner
 * @param challengerScore
 * @param challengeeScore
 * @returns {Promise} - Resolves if successful
 */
function concludeChallenge(challenge, winner, challengerScore, challengeeScore) {
	return new Promise(function(resolve, reject) {
        if (!challenge.challenger._id || !challenge.challengee._id) {
            console.log("This error is likely caused by not calling populate().");
            return reject(new Error('Two teams were not provided.'));
        }

        var loser = (winner._id == challenge.challenger._id) ? challenge.challengee : challenge.challenger;
        if (challengerScore != undefined) challenge.challengerScore = challengerScore;
        if (challengeeScore != undefined) challenge.challengeeScore = challengeeScore;
        challenge.winner = winner._id;
        challenge.save()
			.then(function() {
				return swapRanks(winner, loser);
            })
			.then(function() {
                var challengerId = challenge.challenger._id;
                var challengeeId = challenge.challengee._id;
                var gameTime	 = challenge.updatedAt;

                var updateChallenger = Team.findByIdAndUpdate(challengerId, {$set: {lastGame: gameTime}}).exec();
                var updateChallengee = Team.findByIdAndUpdate(challengeeId, {$set: {lastGame: gameTime}}).exec();

               	return Promise.all([updateChallenger, updateChallengee]);
			})
			.then(resolve)
			.catch(reject);
	});
}


module.exports = router;
