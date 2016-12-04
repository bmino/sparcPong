var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var Team = mongoose.model('Team');
var TeamChallenge = mongoose.model('TeamChallenge');

/* 
 * POST new team
 *
 * @param: username
 * @param: leaderId
 * @param: partnerId
 */
router.post('/', function(req, res, next) {
	var username = req.body.username;
	var leaderId = req.body.leaderId;
	var partnerId = req.body.partnerId;
	
	if (!username || typeof username != 'string' || username.length == 0)
		return next(new Error('Invalid username data type.'));
	
	if (!leaderId || !partnerId)
		return next(new Error('Invalid team members.'));
	
	var teamUsername = username ? username.trim() : null;
	
	validUsername(teamUsername, function(err) {
		if (err) return next(err);
		
		Player.findById(leaderId, function(err, leader) {
			if (err) return next(err);
			Player.findById(partnerId, function(err, partner) {
				if (err) return next(err);
				
				getLowestTeamRank(function(err, lowestRank) {
					if (err) return next(err);
					
					console.log('Creating new team.');
				
					// Create new team
					var team = new Team();
					team.username = teamUsername;
					team.leader = leader._id;
					team.partner = partner._id;
					team.rank = lowestRank + 1;
					
					console.log(team);
					
					// Saves team to DB
					team.save(function(err) {
						if (err) return next(err);
						req.app.io.sockets.emit('team:new', teamUsername);
						console.log('Successfully created a new team.');
						res.json({message: 'Team created!'});
					});
				});
			});
		});
	});
});
	
/* 
 * POST changes team username
 *
 * @param: teamId
 * @param: playerId
 * @param: newUsername
 */
router.post('/change/username', function(req, res, next) {
	var teamId = req.body.teamId;
	var newUsername = req.body.newUsername ? req.body.newUsername.trim() : null;
	if (!teamId || !playerId)
		return next(new Error('You must provide a valid player ids.'));
	
	validUsername(newUsername, function(err) {
		if (err) return next(err);
	
		console.log('Changing team username.');
		Team.findById(teamId, function(err, team) {
			if (err) return next(err);
			if (playerId != team.leader._id) return next(new Error('Only the team leader can change the team name.'));
			var oldUsername = team.username;
			team.username = newUsername;
			team.save(function(err) {
				if (err) return next(err);
				req.app.io.sockets.emit('team:change:username', {oldUsername: oldUsername, newUsername: newUsername});
				res.json({message: 'Successfully changed your username from '+ oldUsername +' to '+ newUsername +'!'});
			});
		});
	});
});


/* GET team listing */
router.get('/', function(req, res, next) {
	Team.find({}, function(err, teams) {
		if (err) return next(err);
		res.json({message: teams});
	});
});

/* GET team by id */
router.get('/fetch/:teamId', function(req, res, next) {
	var teamId = req.params.teamId;
	if (!teamId) return next(new Error('You must specify a team id.'));
	
	Team.findById(teamId, function(err, team) {
		if (err) {
			return next(err);
		} else {
			res.json({message: team});
		}
	});
});


/* GET the wins and losses for a team
 *
 * @param: teamId
 */
router.get('/record/:teamId', function(req, res, next) {
	var teamId = req.params.teamId;
	if (!teamId) return next(new Error('You must specify a team id.'));
	TeamChallenge.find({ $and: [
						{$or: [{'challengee': teamId}, {'challenger': teamId}] },
						{'winner': {$ne: null}}
					]}, function(err, challenges) {
		if (err) return next(err);
		var wins = 0;
		var losses = 0;
		challenges.forEach(function(challenge) {
			if (challenge.winner == teamId) {
				wins++;
			} else {
				losses++;
			}
		});
		res.json({message: {wins: wins, losses: losses}});
	});
});

function getLowestTeamRank(callback) {
	Team.find().sort({'rank': -1}).limit(1).exec(function(err, lowestRankTeam) {
		if (err) {
			callback(err, null);
			return;
		}
		var lowestRank = 0;
		if (lowestRankTeam && lowestRankTeam.length > 0) {
			lowestRank = lowestRankTeam[0].rank;
		}
		console.log('Found lowest team rank of ' + lowestRank);
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
	
	// Allowed character length
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

function usernameExists(username, callback) {
	console.log('Checking if team username, '+ username +', exists.');
	Team.count({username: username}, function(err, count) {
		if (err) {
			callback(err);
		} else if (count != 0) {
			callback(new Error('Username already exists.'));
		} else {
			callback(null);
		}
	});
}

module.exports = router;
