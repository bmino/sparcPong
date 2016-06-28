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

/* GET challenges issued by player
 * 
 * @param: playerId
 */
router.get('/outgoing/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	Challenge.find({challenger: playerId}, function(err, challenges) {
		if (err) {
			return next(err);
		}
		res.json({message: challenges});
	});
});

/* GET challenges pending to a player
 * 
 * @param: playerId
 */
router.get('/incoming/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	Challenge.find({challengee: playerId}, function(err, challenges) {
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
	Challenge.remove({challenger: challengerId}, function(err, challenge) {
		if (err) {
			return next(err);
		}
		res.json({message: 'Succesfully revoked Challenge.'});
	});
});

/* DELETE completed Challenge by challengerId and challengeeId
 *
 * @param: challengerId
 * @param: challengeeId
 */
router.delete('/resolve', function(req, res, next) {
	var challengerId = req.body.challengerId;
	var challengeeId = req.body.challengeeId;
	Challenge.remove({challenger: challengerId, challengee: challengeeId}, function(err, challenge) {
		if (err) {
			return next(err);
		}
		res.json({message: 'Succesfully resolved Challenge.'});
	});
});

function challengesOutgoing(playerId) {
	Challenge.find({challenger: playerId}).count(function(err, count) {
		if (err) {
			return next(err);
		}
		return count;
	});
}

function challengesIncoming(playerId) {
	Challenge.find({challengee: playerId}).count(function(err, count) {
		if (err) {
			return next(err);
		}
		return count;
	});
}


module.exports = router;
