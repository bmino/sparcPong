var mongoose = require('mongoose');
var Authorization = mongoose.model('Authorization');
var Player = mongoose.model('Player');
var jwt = require('jsonwebtoken');

var AuthService = {
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    JWT_AUTH_HEADER_PREFIX: process.env.JWT_AUTH_HEADER_PREFIX || 'JWT',
    JWT_ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
    JWT_EXPIRATION_DAYS: process.env.JWT_EXPIRATION_DAYS || 5,
    JWT_REJECT_IAT_BEFORE: process.env.JWT_REJECT_IAT_BEFORE || new Date(2017, 0).getTime(),
    PASSWORD_RESET_WINDOW_HOURS: process.env.PASSWORD_RESET_WINDOW_HOURS || 2,

    createToken : createToken,
    verifyToken: verifyToken,

    validateCredentials : validateCredentials,
    validateTokenCredentials : validateTokenCredentials,
    validatePasswordStrength : validatePasswordStrength,

    getLogins : getLogins
};

module.exports = AuthService;

function createToken(playerId) {
    console.log('Attempting to create token for ' + playerId);

    return new Promise(function(resolve, reject) {
        var payload = {
            playerId: playerId,
            iat: new Date().getTime()
        };
        var options = {
            algorithm: AuthService.JWT_ALGORITHM,
            expiresIn: AuthService.JWT_EXPIRATION_DAYS + 'd'
        };
        try {
            var token = jwt.sign(payload, AuthService.JWT_SECRET_KEY, options);
            console.log('Successfully created a token');
            return resolve(token);
        } catch (err) {
            console.log(err);
            return reject(err);
        }
    });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, AuthService.JWT_SECRET_KEY);
    } catch (err) {
        console.log(err);
        return false;
    }
}

function validateCredentials(playerId, password) {
    console.log('Validating credentials.');
    return new Promise(function(resolve, reject) {
        Authorization.findByPlayerId(playerId)
            .then(function(authorization) {
                if (authorization.isPasswordEqualTo(password)) return resolve(playerId);
                return reject(new Error('Incorrect password'));
            })
            .catch(function(error) {
                console.log(error);
                return reject('Invalid credentials.');
            });
    });
}

function validateTokenCredentials(token) {
    console.log('Validating credentials via existing token.');
    return new Promise(function(resolve, reject) {
        var payload = AuthService.verifyToken(token);
        if (!payload) return reject(new Error('Invalid token credential.'));
        return resolve(payload);
    });
}

function validatePasswordStrength(password) {
    return new Promise(function(resolve, reject) {
        if (!password) return reject(new Error('Password cannot be empty.'));
        if (password.length < 6) return reject(new Error('Password must be at least 6 characters in length.'));
        if (password.length > 32) return reject(new Error('Password cannot be longer than 32 characters.'));
        return resolve(password);
    });
}

function getLogins() {
    return Player.find({}, 'username _id').exec()
        .then(function(players) {
            return players;
        });
}