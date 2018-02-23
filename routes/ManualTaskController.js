var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var Challenge = mongoose.model('Challenge');
var PlayerChallengeService = require('../services/PlayerChallengeService');


router.get('/challenge', function(req, res, next) {
    if (!req.query.key || req.query.key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');

    console.log('[Manual] - Challenge task has been engaged');

    Player.find({}).sort('rank').exec()
        .then(function(players) {
            return issueChallenges(players, players.length-1, players.length-2, req);
        })
        .then(function(issued) {
            var msg = 'Issued ' + issued + ' challenges';
            console.log(msg);
            res.json(msg);
        })
        .catch(next);
});

function issueChallenges(players, challengerIndex, challengeeIndex, req, issued) {
    if (!issued) issued = 0;

    // Done checking players
    if (challengerIndex === 0) return Promise.resolve(issued);
    // Must check next player
    if (challengeeIndex < 0) return issueChallenges(players, --challengerIndex, challengerIndex - 1, req, issued);

    console.log('[Manual] - ' + players[challengerIndex].username + ' vs ' + players[challengeeIndex].username);
    return PlayerChallengeService.doChallenge(players[challengeeIndex]._id, players[challengerIndex]._id, req)
        .then(function() {
            issued++;
            challengerIndex--;
            challengeeIndex = challengerIndex - 1;
        })
        .catch(function(err) {
            console.error(err);
            challengeeIndex--;
        })
        .then(function() {
            return issueChallenges(players, challengerIndex, challengeeIndex, req, issued);
        });
}

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
