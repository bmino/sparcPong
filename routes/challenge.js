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
			res.send(err);
		}
		res.json({message: 'Challenge created!'});
	});
});

/* GET all Challenge listing */
router.get('/', function(req, res) {
	Challenge.find({}, function(err, challenges) {
		if (err) {
			res.send(err);
		}
		res.json(challenges);
	})
});

/* PUT updated Challenge */
router.put('/', function(req, res) {
	// TODO: implement
	res.json({message: 'Not implemented yet.'});
	console.log('PUT Challenge not implemented.');
});

/* DELETE Challenge by challengerId
 *
 * @param: challengeId
 */
router.delete('/', function(req, res) {
	var challengeId = req.params.ChallengeId;
	Challenge.remove({_id: challengeId}, function(err, challenge) {
		if (err) {
			res.send(err);
		}
		res.json({message: 'Succesfully deleted Challenge.'});
	});
});



module.exports = router;
