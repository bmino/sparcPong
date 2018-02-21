var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Challenge = mongoose.model('Challenge');
var PlayerChallengeService = require('../services/PlayerChallengeService');


router.get('/forfeit', function(req, res, next) {
	if (!req.query.key || req.query.key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');

	console.log('[Manual] - Forfeit task has been engaged');

	var forfeitPromises = [];

	Challenge.getAllExpired()
		.then(function(challenges) {
			console.log('[Manual] - Found ' + challenges.length + ' expired challenges');

            challenges.forEach(function(challenge) {
            	var promise = PlayerChallengeService.doForfeit(challenge._id, challenge.challengee, req);
                forfeitPromises.push(promise);
            });
		});

	Promise.all(forfeitPromises)
        .then(function(results) {
        	var msg = 'Forfeited ' + results.length + ' challenges';
        	console.log('[Manual] - ' + msg);
            res.json(msg);
        })
		.catch(next);
});


module.exports = router;
