var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Challenge = mongoose.model('Challenge');

/* POST new Challenge
 *
 * @param: challengerId
 * @param: challengeeId
 */
router.post('/', function(req, res) {
	var challenge = new Challenge();
	challenge.challengerId = req.body.challengerId;
	challenge.challengeeId = req.body.challengeeId;
	
	challenge.save(function(err) {
		if (err) {
			return next(err);
		} else if (challenge.challengerId == challenge.challengeeId) {
			return next(new Error('Players cannot challenge themselves.'));
		}
		res.json({message: 'Challenge issued!'});
	});
});

/* GET challenges issued by player
 * 
 * @param: playerId
 */
router.get('/outgoing/:playerId', function(req, res) {
	var playerId = req.params.playerId;
	Challenge.find({challengerId: playerId}, function(err, challenges) {
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
router.get('/incoming/:playerId', function(req, res) {
	var playerId = req.params.playerId;
	Challenge.find({challengeeId: playerId}, function(err, challenges) {
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
router.delete('/revoke', function(req, res) {
	var challengerId = req.body.challengerId;
	Challenge.remove({challengerId: challengerId}, function(err, challenge) {
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
router.delete('/resolve', function(req, res) {
	var challengerId = req.body.challengerId;
	var challengeeId = req.body.challengeeId;
	Challenge.remove({challengerId: challengerId, challengeeId: challengeeId}, function(err, challenge) {
		if (err) {
			return next(err);
		}
		res.json({message: 'Succesfully resolved Challenge.'});
	});
});



module.exports = router;
