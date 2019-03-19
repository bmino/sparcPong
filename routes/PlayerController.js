const express = require('express');
const router = express.Router();
const auth = require('../middleware/jwtMiddleware');
const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const PlayerService = require('../services/PlayerService');
const AuthService = require('../services/AuthService');

/**
 * Creates new player
 * @param: username
 * @param: password
 * @param: firstName
 * @param: lastName
 * @param: phone
 * @param: email
 */
router.post('/', (req, res, next) => {
    const { username, password, firstName, lastName, phone, email } = req.body;
    
    if (!username) return next(new Error('Username is required'));
    if (!password) return next(new Error('Password is required'));
    if (!firstName) return next(new Error('First name is required'));
    if (!lastName) return next(new Error('Last name is required'));
    if (!phone) return next(new Error('Phone is required'));
    if (!email) return next(new Error('Email is required'));

    if ((typeof username !== 'string') ||
        (typeof password !== 'string') ||
        (typeof firstName !== 'string') ||
        (typeof lastName !== 'string') ||
        (typeof phone !== 'number') ||
        (typeof email !== 'string'))
        return next(new Error('Invalid data type of Player parameters'));

    PlayerService.createPlayer(username.trim(), password.trim(), firstName.trim(), lastName.trim(), phone, email.trim())
        .then(() => {
            res.json({message: 'Player created!'});
        })
        .catch(next);
});

/**
 * Changes player username
 * @param: newName
 */
router.post('/change/username', auth.jwtAuthProtected, (req, res, next) => {
    const { newUsername } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!newUsername) return next(new Error('New username is required'));

    if (typeof newUsername !== 'string') {
        return next(new Error('Invalid username data type'));
    }

    PlayerService.changeUsername(newUsername.trim(), clientId)
        .then(() => {
            res.json({message: `Successfully changed your username!`});
        })
        .catch(next);
});

/**
 * Changes player password
 * @param: oldPassword
 * @param: newPassword
 */
router.post('/change/password', auth.jwtAuthProtected, (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!oldPassword) return next(new Error('Old password is required'));
    if (!newPassword) return next(new Error('New password is required'));

    PlayerService.changePassword(oldPassword.trim(), newPassword.trim(), clientId)
        .then(() => {
            res.json({message: 'Successfully changed your password!'});
        })
        .catch(next);
});


/**
 * Changes player email
 * @param: newEmail
 */
router.post('/change/email', auth.jwtAuthProtected, (req, res, next) => {
    const { newEmail } = req.body;
    let clientId = AuthService.verifyToken(req.token).playerId;

    if (!newEmail) return next(new Error('New email is required'));

    PlayerService.changeEmail(newEmail.trim(), clientId)
        .then(() => {
            res.json({message: `Successfully changed your email!`});
        })
        .catch(next);
});

/**
 * Removes player email
 */
router.post('/change/email/remove', auth.jwtAuthProtected, (req, res, next) => {
    let clientId = AuthService.verifyToken(req.token).playerId;

    PlayerService.removeEmail(clientId)
        .then(() => {
            res.json({message: 'Successfully removed your email!'});
        })
        .catch(next);
});


/**
 * Get player listing
 */
router.get('/', auth.jwtAuthProtected, (req, res, next) => {
    Player.find({active: true}).exec()
        .then((players) => {
            res.json({message: players});
        })
        .catch(next);
});

/**
 * Get player by id
 * @param: playerId
 */
router.get('/fetch/:playerId', auth.jwtAuthProtected, (req, res, next) => {
    const { playerId } = req.params;

    if (!playerId) return next(new Error('You must specify a player id'));

    Player.findById(playerId).exec()
        .then((player) => {
            if (!player) return Promise.reject(new Error('No player was found for that id'));
            res.json({message: player});
        })
        .catch(next);
});


module.exports = router;
