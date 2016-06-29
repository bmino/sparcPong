var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Challenge = mongoose.model('Challenge');

/* POST new Challenge
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
	
	challenge.save(function(err) {
		if (err) {
			return next(err);
		}
		res.json({message: 'Challenge issued!'});
	});
});

/* GET unresolved challenges issued by player
 * 
 * @param: playerId
 */
router.get('/outgoing/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	Challenge.find({challenger: playerId, winner: null}, function(err, challenges) {
		if (err) {
			return next(err);
		}
		res.json({message: challenges});
	});
});

/* GET unresolved challenges pending to a player
 * 
 * @param: playerId
 */
router.get('/incoming/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	Challenge.find({challengee: playerId, winner: null}, function(err, challenges) {
		if (err) {
			return next(err);
		}
		res.json({message: challenges});
	});
});

/* DELETE wrongly issued Challenge by challengerId
 *
 * @param: challengerId
 */
router.delete('/revoke', function(req, res, next) {
	var challengerId = req.body.challengerId;
	Challenge.remove({challenger: challengerId, winner: null}, function(err, challenges) {
		if (err) {
			return next(err);
		}
		res.json({message: 'Succesfully revoked Challenge.'});
	});
});

/* POST resolved Challenge by challengerId and challengeeId
 *
 * @param: challengerId
 * @param: challengeeId
 */
router.post('/resolve', function(req, res, next) {
	var challengerId = req.body.challengerId;
	var challengeeId = req.body.challengeeId;
	var challengerScore = req.body.challengerScore;
	var challengeeScore = req.body.challengeeScore;
	var winner = challengerScore > challengeeScore ? challengerId : challengeeId;
	
	if (!challengerId || !challengeeId)
		return next(new Error('Both players are required to resolve a challenge.'));
	if (challengerScore == challengeeScore)
		return next(new Error('The final score cannot be equal.'));
	
	
						// Find Conditions
	Challenge.update({	challenger: challengerId, 
						challengee: challengeeId}, 
						// Update Data
					{	challengerScore: challengerScore, 
						challengeeScore: challengeeScore, 
						winner: winner}, function(err, challenges) {
		if (err) {
			return next(err);
		}
		res.json({message: 'Succesfully resolved Challenge.'});
	});
});

function challengesOutgoing(playerId) {
	Challenge.find({challenger: playerId, winner: null}).count(function(err, count) {
		if (err) {
			console.log(err);
		}
		return count;
	});
}

function challengesIncoming(playerId) {
	Challenge.find({challengee: playerId, winner: null}).count(function(err, count) {
		if (err) {
			console.log(err);
		}
		return count;
	});
}


module.exports = router;
