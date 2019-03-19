const express = require('express');
const router = express.Router();
const auth = require('../middleware/jwtMiddleware');
const mongoose = require('mongoose');
const Team = mongoose.model('Team');
const TeamService = require('../services/TeamService');
const AuthService = require('../services/AuthService');

/**
 * Create new team
 * @param: username
 * @param: leaderId
 * @param: partnerId
 */
router.post('/', auth.jwtAuthProtected, (req, res, next) => {
    const { username, leaderId, partnerId } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!username) return next(new Error('Username is required'));
    if (!leaderId) return next(new Error('Leader id is required'));
    if (!partnerId) return next(new Error('Partner id is required'));

    if (typeof username !== 'string' || username.length === 0) {
        return next(new Error('Invalid username data type'));
    }

    TeamService.createTeam(username.trim(), leaderId, partnerId, clientId)
        .then(() => {
            res.json({message: 'Team created!'});
        })
        .catch(next);
});

/**
 * Change team username
 * @param: teamId
 * @param: newUsername
 */
router.post('/change/username', auth.jwtAuthProtected, (req, res, next) => {
    const { teamId, newUsername } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!teamId) return next(new Error('Team id is required'));
    if (!newUsername) return next(new Error('New username is required'));

    if (typeof newUsername !== 'string' || newUsername.length === 0) {
        return next(new Error('Invalid username data type'));
    }


    TeamService.changeTeamName(teamId, newUsername.trim(), clientId)
        .then(() => {
            res.json({message: `Successfully changed your team name to ${newUsername}!`});
        })
        .catch(next);
});


/**
 * Get all teams
 */
router.get('/', auth.jwtAuthProtected, (req, res, next) => {
    Team.find({})
        .then((teams) => {
            res.json({message: teams});
        })
        .catch(next);
});

/**
 * Get team by id
 * @param: teamId
 */
router.get('/fetch/:teamId', auth.jwtAuthProtected, (req, res, next) => {
    const { teamId } = req.params;

    if (!teamId) return next(new Error('Team id is required'));

    Team.findById(teamId).populate('leader partner').exec()
        .then((team) => {
            res.json({message: team});
        })
        .catch(next);
});

/**
 * Get teams by playerId
 * @param: playerId
 */
router.get('/fetch/byPlayerId/:playerId', auth.jwtAuthProtected, (req, res, next) => {
    const { playerId } = req.params;

    if (!playerId) return next(new Error('Player id is required'));

    Team.getTeamByPlayerId(playerId)
        .then((team) => {
            res.json({message: team});
        })
        .catch(next);
});


module.exports = router;
