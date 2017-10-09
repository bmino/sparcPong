var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var Challenge = mongoose.model('Challenge');
var Alert = mongoose.model('Alert');

/* 
 * POST new player
 *
 * @param: name
 * @param: phone
 * @param: email
 */
router.post('/', function(req, res, next) {
	if ((req.body.username && typeof req.body.username !== 'string') ||
		(req.body.firstName && typeof req.body.firstName !== 'string') ||
		(req.body.lastName && typeof req.body.lastName !== 'string') ||
		(req.body.phone && typeof req.body.phone !== 'number') ||
		(req.body.email && typeof req.body.email !== 'string'))
		return next(new Error('Invalid data type of Player parameters.'));
	
	var playerUsername = req.body.username ? req.body.username.trim() : null;
	var playerFirstName = req.body.firstName ? req.body.firstName.trim() : null;
	var playerLastName = req.body.lastName ? req.body.lastName.trim() : null;
	var playerPhone = req.body.phone;
	var playerEmail = req.body.email ? req.body.email.replace(/\s+/g, '') : "";

    // Create new player
    var player = new Player();
    player.username = playerUsername;
    player.firstName = playerFirstName;
    player.lastName = playerLastName;
    player.phone = playerPhone;
    player.email = playerEmail;


	Promise.all([player.validRealName(), player.validUsername(), player.validEmail(), Player.lowestRank()])
		.then(function(values) {
			// Set initial rank of player
			player.rank = values[3] + 1;
			return player.save();
		})
		.then(Alert.attachToPlayer)
		.then(function() {
            req.app.io.sockets.emit('player:new', playerUsername);
            console.log('Successfully created a new player.');
            res.json({message: 'Player created!'});
		})
		.catch(next);
});

/* 
 * POST changes player username
 *
 * @param: newName
 */
router.post('/change/username', function(req, res, next) {
	var playerId = req.body.playerId;
	var newUsername = req.body.newUsername ? req.body.newUsername.trim() : null;
	if (!playerId) return next(new Error('You must provide a valid player id.'));
	
	Player.findById(playerId).exec()
		.then(function(player) {
            if (!player) return next(new Error('Could not find your account.'));
            player.username = newUsername;
            return player.validUsername();
        })
		.then(function(player) {
            return player.save();
		})
		.then(function() {
            req.app.io.sockets.emit('player:change:username');
            res.json({message: 'Successfully changed your username to '+ newUsername});
		})
		.catch(next);
});


/* 
 * POST changes player email
 *
 * @param: playerId
 * @param: newEmail
 */
router.post('/change/email', function(req, res, next) {
	var playerId = req.body.playerId;
	var newEmail = req.body.newEmail ? req.body.newEmail.replace(/\s+/g, '') : null;
	if (!playerId) return next(new Error('You must provide a valid player id.'));
	if (!newEmail || newEmail.length === 0) return next(new Error('You must provide an email address.'));
	if (newEmail.length > 50) return next(new Error('Your email length cannot exceed 50 characters.'));
	
	Player.findById(playerId).exec()
		.then(function(player) {
            if (!player) return next(new Error('Could not find your current account.'));
            player.email = newEmail;
            return player.validEmail();
		})
		.then(function(player) {
			console.log('Changing player email.');
			return player.save();
		})
		.then(function() {
            req.app.io.sockets.emit('player:change:email');
            res.json({message: 'Successfully changed your email to '+ newEmail +'!'});
		})
		.catch(next);
});

/* 
 * POST removes player email
 *
 * @param: playerId
 */
router.post('/change/email/remove', function(req, res, next) {
	var playerId = req.body.playerId;
	if (!playerId) return next(new Error('You must provide a valid player id.'));
	
	console.log('Removing player email.');
	Player.findById(playerId).exec()
		.then(function(player) {
            if (!player) return next(new Error('Could not find your current account.'));
            player.email = '';
            return player.save();
        })
		.then(function() {
			req.app.io.sockets.emit('player:change:email');
			res.json({message: 'Successfully removed your email!'});
		})
		.catch(next);
});


/* GET player listing */
router.get('/', function(req, res, next) {
	Player.find({}).exec()
		.then(function(players) {
            res.json({message: players});
        })
		.catch(next);
});

/* GET player by id */
router.get('/fetch/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	if (!playerId) return next(new Error('You must specify a player id.'));
	
	Player.findById(playerId).exec()
		.then(function(player) {
            if (!player) return next(new Error('No player was found for that id.'));
            res.json({message: player});
        })
		.catch(next);
});


/* GET the wins and losses for a player
 *
 * @param: playerId
 */
router.get('/record/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	if (!playerId) return next(new Error('You must specify a player id.'));

	Challenge.getResolved(playerId)
		.then(function(challenges) {
			var wins = 0;
			var losses = 0;
            challenges.forEach(function(challenge) {
                if (challenge.winner === playerId) wins++;
                else losses++;
            });
            res.json({message: {wins: wins, losses: losses}});
        })
		.catch(next);
});

module.exports = router;
