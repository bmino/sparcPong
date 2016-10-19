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
	if ((req.body.username && typeof req.body.username != 'string') ||
		(req.body.firstName && typeof req.body.firstName != 'string') ||
		(req.body.lastName && typeof req.body.lastName != 'string') ||
		(req.body.phone && typeof req.body.phone != 'number') ||
		(req.body.email && typeof req.body.email != 'string'))
		return next(new Error('Invalid data type of Player parameters.'));
	
	var playerUsername = req.body.username ? req.body.username.trim() : null;
	var playerFirstName = req.body.firstName ? req.body.firstName.trim() : null;
	var playerLastName = req.body.lastName ? req.body.lastName.trim() : null;
	var playerPhone = req.body.phone;
	var playerEmail = req.body.email ? req.body.email.replace(/\s+/g, '') : "";
	
	validRealName(playerFirstName, playerLastName, function(err) {
		if (err) return next(err);
		
		validUsername(playerUsername, function(err) {
			if (err) return next(err);
			
			validEmail(playerEmail, function(err) {
				if (err) return next(err);
				
				getLowestRank(function(err, lowestRank) {
					if (err) return next(err);
					
					console.log('Creating new player.');
					
					// Creates player alerts
					console.log('Creating player alert settings.');
					var newAlert = new Alert();
					newAlert.save(function(err) {
						if (err) return next(err);
						
						// Create new player
						var player = new Player();
						player.username = playerUsername;
						player.firstName = playerFirstName;
						player.lastName = playerLastName;
						player.alerts = newAlert._id;
						player.rank = lowestRank + 1;
						player.phone = playerPhone;
						player.email = playerEmail;
						
						// Saves player to DB
						player.save(function(err) {
							if (err) return next(err);
							req.app.io.sockets.emit('player:new', playerUsername);
							console.log('Successfully created a new player.');
							res.json({message: 'Player created!'});
						});
					});
				});
			});
		});
	});
});

/* 
 * POST changes player username
 *
 * @param: newName
 */
router.post('/change/username', function(req, res, next) {
	var playerId = req.body.playerId;
	var newUsername = req.body.newUsername ? req.body.newUsername.trim() : null;
	if (!playerId)
		return next(new Error('You must provide a valid player id.'));
	
	validUsername(newUsername, function(err) {
		if (err) return next(err);
	
		console.log('Changing player username.');
		Player.findById(playerId, function(err, player) {
			if (err) return next(err);
			if (!player)
				return next(new Error('Could not find your current account.'));
			var oldUsername = player.username;
			player.username = newUsername;
			player.save(function(err) {
				if (err) return next(err);
				req.app.io.sockets.emit('player:change:username', {oldUsername: oldUsername, newUsername: newUsername});
				res.json({message: 'Successfully changed your username from '+ oldUsername +' to '+ newUsername +'!'});
			});
		});
	});
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
	if (!playerId)
		return next(new Error('You must provide a valid player id.'));
	if (!newEmail || newEmail.length == 0)
		return next(new Error('You must provide an email address.'));
	if (newEmail.length > 50)
		return next(new Error('Your email length cannot exceed 50 characters.'));
	
	validEmail(newEmail, function(err) {
		if (err) return next(err);
	
		console.log('Changing player email.');
		Player.findById(playerId, function(err, player) {
			if (err) return next(err);
			if (!player)
				return next(new Error('Could not find your current account.'));
			var oldEmail = player.email;
			player.email = newEmail;
			player.save(function(err) {
				if (err) return next(err);
				req.app.io.sockets.emit('player:change:email', {oldEmail: oldEmail, newEmail: newEmail});
				res.json({message: 'Successfully changed your email to '+ newEmail +'!'});
			});
		});
	});
});

/* 
 * POST removes player email
 *
 * @param: playerId
 */
router.post('/change/email/remove', function(req, res, next) {
	var playerId = req.body.playerId;
	if (!playerId)
		return next(new Error('You must provide a valid player id.'));
	
	console.log('Removing player email.');
	Player.findById(playerId, function(err, player) {
		if (err) return next(err);
		if (!player)
			return next(new Error('Could not find your current account.'));
		var oldEmail = player.email;
		var newEmail = "";
		player.email = newEmail;
		player.save(function(err) {
			if (err) return next(err);
			req.app.io.sockets.emit('player:change:email', {oldEmail: oldEmail, newEmail: newEmail});
			res.json({message: 'Successfully removed your email!'});
		});
	});
});


/* GET player listing */
router.get('/', function(req, res, next) {
	Player.find({}, function(err, players) {
		if (err) return next(err);
		res.json({message: players});
	});
});

/* GET player by id */
router.get('/fetch/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	
	if (!playerId)
		return next(new Error('You must specify a player id.'));
	
	Player.findById(playerId, function(err, players) {
		if (err) {
			return next(err);
		} else if (!players) {
			console.log('Could not find player with id: ' + playerId);
			return next(new Error('No player was found for that id.'));
		} else {
			res.json({message: players});
		}
	});
});


/* GET the wins and losses for a player
 *
 * @param: playerId
 */
router.get('/record/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	if (!playerId) return next(new Error('You must specify a player id.'));
	Challenge.find({ $and: [
						{$or: [{'challengee': playerId}, {'challenger': playerId}] },
						{'winner': {$ne: null}}
					]}, function(err, challenges) {
		if (err) return next(err);
		var wins = 0;
		var losses = 0;
		challenges.forEach(function(challenge) {
			if (challenge.winner == playerId) {
				wins++;
			} else {
				losses++;
			}
		});
		res.json({message: {wins: wins, losses: losses}});
	});
});

function getLowestRank(callback) {
	Player.find().sort({'rank': -1}).limit(1).exec(function(err, lowestRankPlayer) {
		if (err) {
			callback(err, null);
			return;
		}
		var lowestRank = 0;
		if (lowestRankPlayer && lowestRankPlayer.length > 0) {
			lowestRank = lowestRankPlayer[0].rank;
		}
		console.log('Found lowest rank of ' + lowestRank);
		callback(err, lowestRank);
	});
}

var USERNAME_LENGTH_MIN = process.env.USERNAME_LENGTH_MIN || 2;
var USERNAME_LENGTH_MAX = process.env.USERNAME_LENGTH_MAX || 15;
function validUsername(username, callback) {
	console.log('Verifying username of '+ username);
	
	if (!username || username == '') {
		callback(new Error('You must give a username.'));
		return;
	}
	
	// Can only be 15 characters long
	if (username.length > USERNAME_LENGTH_MAX || username.length < USERNAME_LENGTH_MIN) {
		callback(new Error('Username length must be between '+ USERNAME_LENGTH_MIN +' and '+ USERNAME_LENGTH_MAX +' characters.'));
		return;
	}
	
	// No special characters
	if (!/^[A-Za-z0-9_ ]*$/.test(username)) {
		callback(new Error('Username can only include letters, numbers, underscores, and spaces.'));
		return;
	}
	
	// Concurrent spaces
	if (/\s{2,}/.test(username)) {
		callback(new Error('You cannot have concurrent spaces.'));
		return;
	}
	
	// Concurrent underscores
	if (/_{2,}/.test(username)) {
		callback(new Error('You cannot have concurrent underscores.'));
		return;
	}
	
	usernameExists(username, function(err) {
		callback(err);
	});
}

function validRealName(first, last, callback) {
	console.log('Verifying real name of '+ first +' '+ last);
	
	if (!first || first == '' || !last || last == '') {
		callback(new Error('You must give a first and last name.'));
		return;
	}
	
	// Can only be 15 characters long
	if (first.length > 15 || first.length < 1 || last.length > 15 || last.length < 1) {
		callback(new Error('First and last name must be between '+ 1 +' and '+ 15 +' characters.'));
		return;
	}
	
	// No special characters
	if (!/^[A-Za-z0-9_ ]*$/.test(first) || !/^[A-Za-z0-9_ ]*$/.test(last)) {
		callback(new Error('First and last name can only include letters, numbers, underscores, and spaces.'));
		return;
	}
	
	// Concurrent spaces
	if (/\s{2,}/.test(first) || /\s{2,}/.test(last)) {
		callback(new Error('First and last name cannot have concurrent spaces.'));
		return;
	}
	
	// Concurrent underscores
	if (/_{2,}/.test(first) || /_{2,}/.test(last)) {
		callback(new Error('First and last name cannot have concurrent underscores.'));
		return;
	}
	
	callback(null);
}

function validEmail(email, callback) {
	console.log('Verifying email of '+ email);
	
	if (email.length == 0) {
		callback(null);
		return;
	}
	
	var count = 0;
	var i = 0;
	for (i in email) {
		if (email[i] == '@') count++;
	}
	if (count != 1) {
		callback(new Error('Email must contain one @ symbol.'));
		return;
	}
	
	count = 0;
	i = 0;
	for (i in email) {
		if (email[i] == '.') count++;
	}
	if (count == 0) {
		callback(new Error('Email must contain at least one period.'));
		return;
	}
	
	emailExists(email, function(err) {
		callback(err);
	});
}

function usernameExists(username, callback) {
	console.log('Checking if username, '+ username +', exists.');
	Player.count({username: username}, function(err, count) {
		if (err) {
			callback(err);
		} else if (count != 0) {
			callback(new Error('Username already exists.'));
		} else {
			callback(null);
		}
	});
}

function emailExists(email, callback) {
	console.log('Checking if email, '+ email +', exists.');
	Player.count({email: email}, function(err, count) {
		if (err) {
			callback(err);
		} else if (count != 0) {
			callback(new Error('Email already exists.'));
		} else {
			callback(null);
		}
	});
}


module.exports = router;
