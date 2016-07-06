var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Challenge = mongoose.model('Challenge');
var Player = mongoose.model('Player');

/* POST new challenge
 *
 * @param: challengerId
 * @param: challengeeId
 */
router.post('/', function(req, res, next) {
	var challenge = new Challenge();
	var challengerId = req.body.challengerId;
	var challengeeId = req.body.challengeeId;
	challenge.challenger = challengerId;
	challenge.challengee = challengeeId;
	
	if (!challengerId || !challengeeId)
		return next(new Error('Two players are required for a challenge.'));
	if (challengerId == challengeeId)
		return next(new Error('Players cannot challenge themselves.'));
	
	challengeExists(challengerId, challengeeId, function(err, exists) {
		if (err)
			return next(err);
		if (exists)
			return next(new Error('A challenge already exists between these players.'));
		
		// Verifies challenger is allowed to issue a challenge
		allowedToChallenge(challengerId, function(err, allowed, message) {
			if (err)
				return next(err);
			if (!allowed) {
				// Not allowed to issue challenges
				return next(new Error(message));
			} else {
				// Not allowed to issue challenges on weekends
				var today = new Date();
				if (today.getDay() == 0 || today.getDay() == 6)
					return next(new Error('You can only issue challenges on business days.'));
				
				// Grabs player info on both challenge participants
				Player.findById(challengerId, function(err, challenger) {
					if (err)
						return next(err);
					Player.findById(challengeeId, function(err, challengee) {
						if (err)
							return next(err);
						
						if (challenger.rank < challengee.rank)
							return next(new Error('You cannot challenger a player below your rank.'));
						else if (Math.abs(getTier(challenger.rank) - getTier(challengee.rank)) > 1)
							return next(new Error('You cannot challenge a player beyond 1 tier.'));
						
						challenge.save(function(err) {
							if (err) {
								return next(err);
							}
							res.json({message: 'Challenge issued!'});
						});
					});
				});
			}
		});
	});	
});


/* GET all resolved challenges involving a player
 * 
 * @param: playerId
 */
router.get('/resolved/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	Challenge.find({ $and: [
						{$or: [{'challenger': playerId}, {'challengee': playerId}]}, 
						{'winner': {$ne: null}}
					]})
					.populate('challenger')
					.populate('challengee')
					.exec(function(err, challenges) {
		if (err) {
			return next(err);
		}
		//console.log('Found ' + challenges.length + ' resolved challenges ' + ' for playerId [' + playerId + ']');
		res.json({message: challenges});
	});
});


/* GET unresolved challenges issued by player
 * 
 * @param: playerId
 */
router.get('/outgoing/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	Challenge.find({challenger: playerId, winner: null})
					.populate('challenger')
					.populate('challengee')
					.exec(function(err, challenges) {
		if (err) {
			return next(err);
		}
		//console.log('Found ' + challenges.length + ' outgoing challenges ' + ' for playerId [' + playerId + ']');
		res.json({message: challenges});
	});
});

/* GET unresolved challenges pending to a player
 * 
 * @param: playerId
 */
router.get('/incoming/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	Challenge.find({challengee: playerId, winner: null})
					.populate('challenger')
					.populate('challengee')
					.exec(function(err, challenges) {
		if (err) {
			return next(err);
		}
		//console.log('Found ' + challenges.length + ' incoming challenges ' + ' for playerId [' + playerId + ']');
		res.json({message: challenges});
	});
});

/* DELETE wrongly issued challenge by challengerId
 *
 * @param: challengerId
 */
router.delete('/revoke', function(req, res, next) {
	var challengerId = req.body.challengerId;
	var challengeeId = req.body.challengeeId;
	
	if (!challengerId || !challengeeId)
		return next(new Error('Both players are required to revoke a challenge.'));
	
	// Checks for forfeit
	Challenge.find({challenger: challengerId, challengee: challengeeId, winner: null}, function(err, challenges) {
		if (err)
			return next(err);
		if (!challenges || challenges.length == 0)
			return next(new Error('Could not find the challenge.'));
		if (hasForfeit(challenges[0].createdAt))
			return next(new Error('This challenge has expired and must be forfeited.'));
		
		Challenge.remove({challenger: challengerId, challengee: challengeeId, winner: null}, function(err, challenges) {
			if (err) {
				return next(err);
			}
			
			if (challenges.result && challenges.result.n) {
				console.log('Revoking ' + challenges.result.n + ' challenge(s).');
				res.json({message: 'Successfully revoked challenge.'});
			} else {
				return next(new Error('Could not find the challenge.'));
			}
		});
	});
});

/* POST resolved challenge by adding a score and winner
 *
 * @param: challengeId
 * @param: challengerScore
 * @param: challengeeScore
 */
router.post('/resolve', function(req, res, next) {
	var challengeId = req.body.challengeId;
	var challengerScore = req.body.challengerScore;
	var challengeeScore = req.body.challengeeScore;
	
	if (!challengeId) {
		console.log(challengeId + ' is not a valid challenge id.');
		return next(new Error('This is not a valid challenge.'));
	}
	if (challengerScore == challengeeScore)
		return next(new Error('The final score cannot be equal.'));
	
	Challenge.findById(challengeId).populate('challenger').populate('challengee').exec(function(err, challenge) {
		if (err)
			return next(err);
		
		if (!challenge || challenge.length == 0) {
			return next(new Error('Could not find the challenge for ['+challengeId+'].'));
		} else if (hasForfeit(challenge.createdAt)) {
			return next(new Error('This challenge has expired. '+challenge.challengee.name+' must forfeit.'));
		} else {
			console.log('Resolving challenge id ['+challengeId+']');
		}
		
		// Checks for forfeit
		if (hasForfeit(challenge))
			return next(new Error('This challenge has expired and must be forfeited.'));
		
		var winner = challengerScore > challengeeScore ? challenge.challenger : challenge.challengee;
		var loser  = challengerScore < challengeeScore ? challenge.challenger : challenge.challengee;
		
		challenge.winner = winner._id;
		challenge.challengerScore = challengerScore;
		challenge.challengeeScore = challengeeScore;
		
		challenge.save();
		
		// Adjusts Rankings
		if (loser.rank < winner.rank) {
			console.log('Swapping rankings between ' + winner.name + ' and ' + loser.name);
			// Winner should move up ranking
			swapRanks(winner._id, loser._id, function(err) {
				if (err)
					return next(err);
				console.log('Swapping rankings completed successfully.');
			});
		} else {
			console.log('Swapping rankings is not required.');
		}
		
		res.json({message: 'Successfully resolved challenge.'});
	});
});

/*
 * Forfeits an expired challenge.
 *
 * @param: challengeId
 */
router.post('/forfeit', function(req, res, next) {
	var challengeId = req.body.challengeId;
	if (!challengeId)
		return next(new Error('This is not a valid challenge id.'));
	Challenge.findById(challengeId, function(err, challenge) {
		if (err)
			return next(err);
		if (!hasForfeit())
			return next(new Error('This challenge has not expired.'));
		swapRanks(challenge.challenger, challenge.challengee, function(err) {
			if (err)
				return next(err);
			
			// Challenger wins in the event of a forfeit
			challenge.winner = challenge.challenger;
			challenge.save();
			
			res.json({message: 'Challenge successfully forfeited.'});
		});
	});
});


/*
 * Determines if an open challenge between two players exists.
 *
 * @param: playerId1
 * @param: playerId2
 *
 * @return: err
 * @return: boolean - true if challenges exist, false if none exist
 */
function challengeExists(playerId1, playerId2, callback) {
	Challenge.find({$or: [ 
						{$and: [{challenger: playerId1}, {challengee: playerId2}, {winner: null}]}, 
						{$and: [{challenger: playerId2}, {challengee: playerId1}, {winner: null}]}
					]}, function(err, challenges) {
		
		if (err) {
			callback(err, false);
		} else {
			var c = (challenges.length > 0) ? true : false
			return callback(null, c);
		}
	});
}

/*
 * Determines if the given challenge issue date should be forfeited.
 *
 * @param: dateIssued - date the challenge was issued
 */
var ALLOWED_CHALLENGE_DAYS = 3;
function hasForfeit(dateIssued) {
	var expires = addBusinessDays(dateIssued, ALLOWED_CHALLENGE_DAYS);
	// Challenge expired before today
	if (expires < new Date())
		return true;
	else
		return false;
}

/*
 * Adds business days to a date.
 *
 * @param: date - the starting date
 * @param: days - number of days to add
 */
function addBusinessDays(date, days) {
	// Bad Inputs
	if (!days || days == 0)
		return date;
	
	var d = date;
	var added = 0;
	while (added < days) {
		// Looks at tomorrow's day
		d.setDate(d.getDate()+1);
		if (isBusinessDay(d)) {
			added++;
		}
	}
	return d;
}

/*
 * Determines if the given date is a business day.
 *
 * @param: date
 */
function isBusinessDay(date) {
	return date.getDay() != 0 && date.getDay() != 6;
}

/*
 * Determines if a given player is eligible to issue challenges.
 *
 * @param: playerId
 *
 * @return: err
 * @return: boolean - true if allowed, and false if not allowed
 * @return: String - error message if not allowed
 */
var ALLOWED_CHALLENGES = 1;
function allowedToChallenge(playerId, callback) {
	countChallenges(playerId, function(err, incoming, outgoing) {
		if (err)
			callback(err);
		if (incoming > 1)
			callback(err, false, 'Players must resolve incoming challenges before issuing new ones.');
		if (outgoing >= ALLOWED_CHALLENGES)
			callback(err, false, 'Players may only have '+ALLOWED_CHALLENGES+' outgoing challenges.');
		callback(err, true);
	});
}

/*
 * Counts incoming and outgoing challenges for a given player.
 *
 * @param: playerId
 *
 * @return: incoming challenges
 * @return: outgoing challenges
 */
function countChallenges(playerId, callback) {
	Challenge.find({challenger: playerId, winner: null}, function(err, challenges) {
		if (err) {
			callback(err);
		}
		var outgoing = 0;
		if (challenges)
			outgoing = challenges.length;
		Challenge.find({challengee: playerId, winner: null}, function(err, challenges) {
			if (err)
				callback(err);
			var incoming = 0;
			if (challenges)
				incoming = challenges.length;
			callback(err, incoming, outgoing);
		});
	});
}

/*
 * Swaps the rankings for two given players.
 *
 * @param: playerId1
 * @param: playerId2
 *
 * @return: err
 */
function swapRanks(playerId1, playerId2, callback) {
	setRank(playerId1, TEMP_RANK, function(err, oldRank, newRank) {
		if (err)
			callback(err);
		var player1_oldRank = oldRank;
		setRank(playerId2, player1_oldRank, function(err, oldRank, newRank) {
			if (err)
				callback(err);
			var player2_oldRank = oldRank;
			setRank(playerId1, player2_oldRank, function(err, oldRank, newRank) {
				callback(err);
			});
		});
	});
}


/*
 * Manually sets the rank of a given player.
 *
 * @param: playerId
 * @param: newRank
 *
 * @return: err
 * @return: oldRank
 * @return: newRank
 */
var TEMP_RANK = -1;
function setRank(playerId, newRank, callback) {
	Player.findById(playerId, function(err, player) {
		if (err)
			callback(err, null, null);
		var oldRank = player.rank;
		player.rank = newRank;
		player.save(function(err) {
			callback(err, oldRank, newRank);
		});
	});
}


/*
 * Calculates the tier for a given ranking.
 *
 * @param: rank
 *
 * @return: number - tier
 */
function getTier(rank) {
	var tier = 1;
	
	while (true) {
		var tierRanks = getRanks(tier, 1, 0, []);
		for (var r=0; r<tierRanks.length; r++) {
			if (rank == tierRanks[r]) {
				// Found tier
				return tier;
			}
		}
		tier++;
	}
}


/*
 * Calculates the possible ranks for a given tier.
 *
 * @param: tier
 * @param: currentTier - defaults to 1
 * @param: lastRank - defaults to 0
 * @param: ranks - defaults to []
 *
 * @return: array - contains possible ranks
 */
function getRanks(tier, currentTier, lastRank, ranks) {
	if (ranks.length >= tier) {
		return ranks;
	}
	
	var ranks = [];
	for (var r=lastRank+1; r<=lastRank+currentTier; r++) {
		ranks.push(r);
	}
	lastRank = ranks[ranks.length-1];
	
	return getRanks(tier, ++currentTier, lastRank, ranks);
}



module.exports = router;
