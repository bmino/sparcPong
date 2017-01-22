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
	
	if (!leaderId || !partnerId || leaderId == partnerId)
		return next(new Error('Invalid team members.'));
	
	var teamUsername = username ? username.trim() : null;
	
	var validateUsername = validUsername(teamUsername);
	var validateLeaderTeamsCount = validPlayerTeamsCount(leaderId);
	var validatePartnerTeamsCount = validPlayerTeamsCount(partnerId);
	var validateLeader = Player.findById(leaderId).exec();
	var validatePartner = Player.findById(partnerId).exec();
	var lowestTeamRank = getLowestTeamRank();
	
	Promise.all([validateUsername, validateLeaderTeamsCount, validatePartnerTeamsCount, validateLeader, validatePartner, lowestTeamRank])
		.then(function(values) {
			console.log('Creating new team.');
			
			// Create new team
			var team = new Team();
			team.username = teamUsername;
			team.leader = leaderId;
			team.partner = partnerId;
			team.rank = values[5] + 1;
			
			console.log(team);
			
			// Saves team to DB
			team.save(function(err) {
				if (err) return next(err);
				req.app.io.sockets.emit('team:new', teamUsername);
				console.log('Successfully created a new team.');
				res.json({message: 'Team created!'});
			});
		})
		.catch(function(error) {
			return next(error);
		});
});

/* 
 * POST changes team username
 *
 * @param: teamId
 * @param: newUsername
 */
router.post('/change/username', function(req, res, next) {
	var teamId = req.body.teamId;
	var newUsername = req.body.newUsername ? req.body.newUsername.trim() : null;
	if (!teamId || !playerId)
		return next(new Error('You must provide a valid player ids.'));
	
	validUsername(newUsername)
		.then(function(result) {
			console.log('Changing team username.');
			Team.findById(teamId, function(err, team) {
				if (err) return next(err);
				if (playerId != team.leader) return next(new Error('Only the team leader can change the team name.'));
				var oldUsername = team.username;
				team.username = newUsername;
				team.save(function(err) {
					if (err) return next(err);
					req.app.io.sockets.emit('team:change:username', {oldUsername: oldUsername, newUsername: newUsername});
					res.json({message: 'Successfully changed your username from '+ oldUsername +' to '+ newUsername +'!'});
				});
			});
		})
		.catch(function(error) {
			return next(error);
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
	
	Team.findById(teamId)
	.populate('leader partner')
	.exec(function(err, team) {
		if (err) return next(err);
		res.json({message: team});
	});
});

/* GET teams by playerId */
router.get('/fetch/lookup/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	if (!playerId) return next(new Error('You must specify a player id.'));
	
	getTeamsByPlayerId(playerId)
		.then(function(teams) {
			res.json({message: teams});
		})
		.catch(function(error) {
			return next(error);
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

function getLowestTeamRank() {
	console.log('Looking for lowest team rank.');
	return new Promise(function(resolve, reject) {
		Team.find().sort({'rank': -1}).limit(1).exec(function(err, lowestRankTeam) {
			if (err) reject(err);
			var lowestRank = 0;
			if (lowestRankTeam && lowestRankTeam.length > 0) {
				lowestRank = lowestRankTeam[0].rank;
			}
			console.log('Found lowest team rank of ' + lowestRank);
			resolve(lowestRank);
		});
	});
}

var PLAYER_TEAMS_MAX = process.env.PLAYER_TEAM_MAX || 1;
function validPlayerTeamsCount(playerId) {
	console.log('Validating if player is a part of too many teams.');
	return new Promise(function(resolve, reject) {
		countTeamsByPlayerId(playerId)
			.then(function(count) {
				var plural = PLAYER_TEAMS_MAX > 1 ? 's' : '';
				console.log('Found ' + count + ' teams associated with this player.');
				if (count >= PLAYER_TEAMS_MAX) {
					reject(new Error('Players may not be a part of more than ' + PLAYER_TEAMS_MAX + ' team' + plural + '.'));
				} else {
					resolve(count);
				}
			})
			.catch(reject);
	});
}

function getTeamsByPlayerId(playerId) {
	return new Promise(function(resolve, reject) {
		Team.find({$or: [{leader: playerId}, {partner: playerId}]}, function(err, teams) {
			if (err) {
				reject(err);
			} else {
				resolve(teams);
			}
		});
	});
}

function countTeamsByPlayerId(playerId) {
	return new Promise(function(resolve, reject) {
		Team.count({$or: [{leader: playerId}, {partner: playerId}]}, function(err, count) {
			if (err) {
				reject(err);
			} else {
				resolve(count);
			}
		});
	});
}

var USERNAME_LENGTH_MIN = process.env.USERNAME_LENGTH_MIN || 2;
var USERNAME_LENGTH_MAX = process.env.USERNAME_LENGTH_MAX || 15;
function validUsername(username) {	
	var checkSyntax = new Promise(function(resolve, reject) {
		console.log('Verifying username of ['+ username +']');
		
		if (!username || username == '')
			reject(new Error('You must give a username.'));
		
		// Allowed character length
		if (username.length > USERNAME_LENGTH_MAX || username.length < USERNAME_LENGTH_MIN)
			reject(new Error('Username length must be between '+ USERNAME_LENGTH_MIN +' and '+ USERNAME_LENGTH_MAX +' characters.'));
		
		// No special characters
		if (!/^[A-Za-z0-9_ ]*$/.test(username))
			reject(new Error('Username can only include letters, numbers, underscores, and spaces.'));
		
		// Concurrent spaces
		if (/\s{2,}/.test(username))
			reject(new Error('Username cannot have concurrent spaces.'));
		
		// Concurrent underscores
		if (/_{2,}/.test(username))
			reject(new Error('Username cannot have concurrent underscores.'));
		
		resolve(true);
	});
	
	var usernameExists = new Promise(function(resolve, reject) {
		console.log('Checking if team username ['+ username +'] exists.');
		Team.count({username: username}, function(err, count) {
			if (err) reject(err);
			if (!count) {
				resolve(true);
			} else {
				reject(new Error('Username already exists.'));
			}
		})
	});
	
	console.log('Validating team username.');
	return new Promise(function(resolve, reject) {
		Promise.all([checkSyntax, usernameExists])
			.then(resolve)
			.catch(reject);
	});
	
}


module.exports = router;
