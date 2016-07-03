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
			
		challenge.save(function(err) {
			if (err) {
				return next(err);
			}
			res.json({message: 'Challenge issued!'});
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
		
		if (challenge.length == 0) {
			return next(new Error('Could not find the challenge for ['+challengeId+'].'));
		} else {
			console.log('Resolving challenge id ['+challengeId+']');
		}
		
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



module.exports = router;
