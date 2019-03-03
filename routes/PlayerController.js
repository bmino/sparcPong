const express = require('express');
const router = express.Router();
const auth = require('../middleware/jwtMiddleware');
const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Challenge = mongoose.model('Challenge');
const PlayerService = require('../services/PlayerService');
const AuthService = require('../services/AuthService');

/**
 * Creates new player
 *
 * @param: username
 * @param: password
 * @param: firstName
 * @param: lastName
 * @param: phone
 * @param: email
 */
router.post('/', function(req, res, next) {
    if ((req.body.username && typeof req.body.username !== 'string') ||
        (req.body.password && typeof req.body.password !== 'string') ||
        (req.body.firstName && typeof req.body.firstName !== 'string') ||
        (req.body.lastName && typeof req.body.lastName !== 'string') ||
        (req.body.phone && typeof req.body.phone !== 'number') ||
        (req.body.email && typeof req.body.email !== 'string'))
        return next(new Error('Invalid data type of Player parameters.'));

    let playerUsername = req.body.username.trim();
    let playerPassword = req.body.password.trim();
    let playerFirstName = req.body.firstName.trim();
    let playerLastName = req.body.lastName.trim();
    let playerPhone = req.body.phone;
    let playerEmail = req.body.email.trim();

    PlayerService.createPlayer(playerUsername, playerPassword, playerFirstName, playerLastName, playerPhone, playerEmail)
        .then(function() {
            res.json({message: 'Player created!'});
        })
        .catch(next);
});

/**
 * Changes player username
 *
 * @param: newName
 */
router.post('/change/username', auth.jwtAuthProtected, function(req, res, next) {
    let newUsername = req.body.newUsername ? req.body.newUsername.trim() : null;
    let clientId = AuthService.verifyToken(req.token).playerId;

    if (!clientId) return next(new Error('You must provide a valid player id.'));

    PlayerService.changeUsername(newUsername, clientId)
        .then(function() {
            res.json({message: `Successfully changed your username to ${newUsername}`});
        })
        .catch(next);
});

/**
 * Changes player password
 *
 * @param: oldPassword
 * @param: newPassword
 */
router.post('/change/password', auth.jwtAuthProtected, function(req, res, next) {
    let oldPassword = req.body.oldPassword ? req.body.oldPassword.trim() : '';
    let newPassword = req.body.newPassword ? req.body.newPassword.trim() : '';
    let clientId = AuthService.verifyToken(req.token).playerId;

    PlayerService.changePassword(oldPassword, newPassword, clientId)
        .then(function() {
            res.json({message: 'Successfully changed your password'});
        })
        .catch(next);
});


/**
 * Changes player email
 *
 * @param: newEmail
 */
router.post('/change/email', auth.jwtAuthProtected, function(req, res, next) {
    let newEmail = req.body.newEmail ? req.body.newEmail.trim() : null;
    let clientId = AuthService.verifyToken(req.token).playerId;

    PlayerService.changeEmail(newEmail, clientId)
        .then(function() {
            res.json({message: `Successfully changed your email to ${newEmail}!`});
        })
        .catch(next);
});

/**
 * Removes player email
 */
router.post('/change/email/remove', auth.jwtAuthProtected, function(req, res, next) {
    let clientId = AuthService.verifyToken(req.token).playerId;

    PlayerService.removeEmail(clientId)
        .then(function() {
            res.json({message: 'Successfully removed your email!'});
        })
        .catch(next);
});


/**
 * Get player listing
 */
router.get('/', auth.jwtAuthProtected, function(req, res, next) {
    Player.find({active: true}).exec()
        .then(function(players) {
            res.json({message: players});
        })
        .catch(next);
});

/**
 * Get player by id
 *
 * @param: playerId
 */
router.get('/fetch/:playerId', auth.jwtAuthProtected, function(req, res, next) {
    let playerId = req.params.playerId;
    if (!playerId) return next(new Error('You must specify a player id.'));

    Player.findById(playerId).exec()
        .then(function(player) {
            if (!player) return Promise.reject(new Error('No player was found for that id.'));
            res.json({message: player});
        })
        .catch(next);
});


/**
 * Get the wins and losses for a player
 *
 * @param: playerId
 */
router.get('/record/:playerId', auth.jwtAuthProtected, function(req, res, next) {
    let playerId = req.params.playerId;
    if (!playerId) return next(new Error('You must specify a player id.'));

    Challenge.getResolved(playerId)
        .then(function(challenges) {
            let wins = 0;
            let losses = 0;
            challenges.forEach(function(challenge) {
                if (challenge.winner.toString() === playerId.toString()) wins++;
                else losses++;
            });
            res.json({message: {wins: wins, losses: losses}});
        })
        .catch(next);
});

module.exports = router;
