var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var Alert = mongoose.model('Alert');

/* 
 * POST new player
 *
 * @param: name
 * @param: phone
 * @param: email
 */
router.post('/', function(req, res, next) {
	if ((req.body.name && typeof req.body.name != 'string') ||
		(req.body.phone && typeof req.body.phone != 'number') ||
		(req.body.email && typeof req.body.email != 'string'))
		return next(new Error('Invalid data type of Player parameters.'));
	
	var playerName = req.body.name ? req.body.name.trim() : null;
	var playerPhone = req.body.phone;
	var playerEmail = req.body.email ? req.body.email.replace(/\s+/g, '') : "";
	
	
	validName(playerName, function(err) {
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
					player.name = playerName;
					player.alerts = newAlert._id;
					player.rank = lowestRank + 1;
					player.phone = playerPhone;
					player.email = playerEmail;
					
					// Saves player to DB
					player.save(function(err) {
						if (err) return next(err);
						req.app.io.sockets.emit('player:new', playerName);
						console.log('Successfully created a new player.');
						res.json({message: 'Player created!'});
					});
				});
			});
		});
	});	
});

/* 
 * POST changes player name
 *
 * @param: newName
 */
router.post('/change/name', function(req, res, next) {
	var playerId = req.body.playerId;
	var newName = req.body.newName ? req.body.newName.trim() : null;
	if (!playerId)
		return next(new Error('You must provide a valid player id.'));
	
	validName(newName, function(err) {
		if (err) return next(err);
	
		console.log('Changing player name.');
		Player.findById(playerId, function(err, player) {
			if (err) return next(err);
			if (!player)
				return next(new Error('Could not find your current account.'));
			var oldName = player.name;
			player.name = newName;
			player.save(function(err) {
				if (err) return next(err);
				req.app.io.sockets.emit('player:change:name', {oldName: oldName, newName: newName});
				res.json({message: 'Successfully changed your username from '+ oldName +' to '+ newName +'!'});
			});
		});
	});
});


/* 
 * POST changes player email
 *
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

var NAME_LENGTH_MIN = process.env.NAME_LENGTH_MIN || 2;
var NAME_LENGTH_MAX = process.env.NAME_LENGTH_MAX || 15;
function validName(name, callback) {
	console.log('Verifying player name of '+ name);
	
	if (!name || name == '') {
		callback(new Error('You must give a name.'));
		return;
	}
	
	// Can only be 15 characters long
	if (name.length > NAME_LENGTH_MAX || name.length < NAME_LENGTH_MIN) {
		callback(new Error('Name length must be between '+ NAME_LENGTH_MIN +' and '+ NAME_LENGTH_MAX +' characters.'));
		return;
	}
	
	// No special characters
	if (!/^[A-Za-z0-9_ ]*$/.test(name)) {
		callback(new Error('Name can only include letters, numbers, underscores, and spaces.'));
		return;
	}
	
	// Concurrent spaces
	if (/\s{2,}/.test(name)) {
		callback(new Error('You cannot have concurrent spaces.'));
		return;
	}
	
	// Concurrent underscores
	if (/_{2,}/.test(name)) {
		callback(new Error('You cannot have concurrent underscores.'));
		return;
	}
	
	nameExists(name, function(err) {
		callback(err);
	});
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

function nameExists(name, callback) {
	console.log('Checking if player name, '+ name +', exists.');
	Player.count({name: name}, function(err, count) {
		if (err) {
			callback(err);
		} else if (count != 0) {
			callback(new Error('Player name already exists.'));
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
