const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Team = mongoose.model('Team');
const TeamChallenge = mongoose.model('TeamChallenge');
const NameService = require('../services/NameService');
const TeamService = require('../services/TeamService');

/**
 * Create new team
 *
 * @param: username
 * @param: leaderId
 * @param: partnerId
 */
router.post('/', function(req, res, next) {
	let username = req.body.username;
	let leaderId = req.body.leaderId;
	let partnerId = req.body.partnerId;
	
	if (typeof username !== 'string' || username.length === 0) return next(new Error('Invalid username data type.'));
	if (!leaderId || !partnerId || leaderId === partnerId) return next(new Error('Invalid team members.'));
	
	let teamUsername = username ? username.trim() : null;
	
	let verifyUsername = NameService.verifyUsername(teamUsername);
	let usernameExists = Team.usernameExists(teamUsername);
	let validateLeaderTeamsCount = TeamService.verifyPlayerCanJoinById(leaderId);
	let validatePartnerTeamsCount = TeamService.verifyPlayerCanJoinById(partnerId);
	let validateLeader = Player.findById(leaderId).exec();
	let validatePartner = Player.findById(partnerId).exec();
	let lowestTeamRank = Team.lowestRank();
	
	Promise.all([verifyUsername, usernameExists, validateLeaderTeamsCount, validatePartnerTeamsCount, validateLeader, validatePartner, lowestTeamRank])
		.then(function(values) {
            let team = new Team();
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
	let teamId = req.body.teamId;
	let newUsername = req.body.newUsername ? req.body.newUsername.trim() : null;
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
            res.json({message: `Successfully changed your team name to ${newUsername}!`});
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
	let teamId = req.params.teamId;
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
	let playerId = req.params.playerId;
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
	let teamId = req.params.teamId;
	if (!teamId) return next(new Error('You must specify a team id.'));

	TeamChallenge.getResolved(teamId)
		.then(function(challenges) {
            let wins = 0;
            let losses = 0;
            challenges.forEach(function(challenge) {
                if (challenge.winner.toString() === teamId.toString()) wins++;
                else losses++;
            });
            res.json({message: {wins: wins, losses: losses}});
		})
		.catch(next);
});


module.exports = router;
