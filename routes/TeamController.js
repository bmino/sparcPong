const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Team = mongoose.model('Team');
const TeamChallenge = mongoose.model('TeamChallenge');
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

    TeamService.createTeam(username, leaderId, partnerId)
        .then(function() {
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

    TeamService.changeTeamName(teamId, newUsername)
        .then(function() {
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
