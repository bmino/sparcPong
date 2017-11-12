var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var Team = mongoose.model('Team');
var TeamChallenge = mongoose.model('TeamChallenge');
var NameService = require('../services/NameService');
var TeamService = require('../services/TeamService');

/**
 * Create new team
 *
 * @param: username
 * @param: leaderId
 * @param: partnerId
 */
router.post('/', function(req, res, next) {
	var username = req.body.username;
	var leaderId = req.body.leaderId;
	var partnerId = req.body.partnerId;
	
	if (typeof username !== 'string' || username.length === 0) return next(new Error('Invalid username data type.'));
	if (!leaderId || !partnerId || leaderId === partnerId) return next(new Error('Invalid team members.'));
	
	var teamUsername = username ? username.trim() : null;
	
	var verifyUsername = NameService.verifyUsername(teamUsername);
	var usernameExists = Team.usernameExists(teamUsername);
	var validateLeaderTeamsCount = TeamService.verifyPlayerCanJoinById(leaderId);
	var validatePartnerTeamsCount = TeamService.verifyPlayerCanJoinById(partnerId);
	var validateLeader = Player.findById(leaderId).exec();
	var validatePartner = Player.findById(partnerId).exec();
	var lowestTeamRank = Team.lowestRank();
	
	Promise.all([verifyUsername, usernameExists, validateLeaderTeamsCount, validatePartnerTeamsCount, validateLeader, validatePartner, lowestTeamRank])
		.then(function(values) {
            var team = new Team();
            team.username = teamUsername;
            team.leader = leaderId;
            team.partner = partnerId;
            team.rank = values[6] + 1;
            return team.save();
        })
		.then(function() {
			req.app.io.sockets.emit('team:new', teamUsername);
			console.log('Successfully created a new team.');
			res.json({message: 'Team created!'});
		})
		.catch(next);
});

/**
 * Change team username
 *
 * @param: teamId
 * @param: newUsername
 */
router.post('/change/username', function(req, res, next) {
	var teamId = req.body.teamId;
	var newUsername = req.body.newUsername ? req.body.newUsername.trim() : null;
	if (!teamId) return next(new Error('You must provide a team id.'));
	
	NameService.verifyUsername(newUsername)
		.then(Team.usernameExists)
		.then(function() {
			return Team.findById(teamId).exec();
		})
		.then(function(team) {
            if (!team) return Promise.reject(new Error('Could not find team.'));

            console.log('Changing team username.');
            team.username = newUsername;
            return team.save();
        })
		.then(function() {
            req.app.io.sockets.emit('team:change:username');
            res.json({message: 'Successfully changed your team name to '+ newUsername +'!'});
		})
		.catch(next);
});


/**
 * Get all teams
 */
router.get('/', function(req, res, next) {
	Team.find({})
		.then(function(teams) {
            res.json({message: teams});
		})
		.catch(next);
});

/**
 * Get team by id
 *
 * @param: teamId
 */
router.get('/fetch/:teamId', function(req, res, next) {
	var teamId = req.params.teamId;
	if (!teamId) return next(new Error('You must specify a team id.'));
	
	Team.findById(teamId).populate('leader partner').exec()
		.then(function(team) {
			res.json({message: team});
		})
		.catch(next);
});

/**
 * Get teams by playerId
 *
 * @param: playerId
 */
router.get('/fetch/lookup/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	if (!playerId) return next(new Error('You must specify a player id.'));
	
	Team.getTeamsByPlayerId(playerId)
		.then(function(teams) {
			res.json({message: teams});
		})
		.catch(next);
});


/**
 * Get wins and losses for a team
 *
 * @param: teamId
 */
router.get('/record/:teamId', function(req, res, next) {
	var teamId = req.params.teamId;
	if (!teamId) return next(new Error('You must specify a team id.'));

	TeamChallenge.getResolved(teamId)
		.then(function(challenges) {
            var wins = 0;
            var losses = 0;
            challenges.forEach(function(challenge) {
                if (challenge.winner.toString() === teamId) wins++;
                else losses++;
            });
            res.json({message: {wins: wins, losses: losses}});
		})
		.catch(next);
});


module.exports = router;
