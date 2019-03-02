const mongoose = require('mongoose');
const Authorization = mongoose.model('Authorization');
const Player = mongoose.model('Player');
const Util = require('./Util');
const jwt = require('jsonwebtoken');

const AuthService = {
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    JWT_AUTH_HEADER_PREFIX: process.env.JWT_AUTH_HEADER_PREFIX || 'JWT',
    JWT_ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
    JWT_EXPIRATION_DAYS: process.env.JWT_EXPIRATION_DAYS || 5,
    JWT_REJECT_IAT_BEFORE: process.env.JWT_REJECT_IAT_BEFORE || new Date(2017, 0).getTime(),
    PASSWORD_RESET_WINDOW_MINUTES: process.env.PASSWORD_RESET_WINDOW_MINUTES || 20,
    PASSWORD_RESET_REPEAT_HOURS: process.env.PASSWORD_RESET_REPEAT_HOURS || 1,
    PASSWORD_MIN_LENGTH: process.env.PASSWORD_MIN_LENGTH !== undefined ? process.env.PASSWORD_MIN_LENGTH : 6,
    PASSWORD_MAX_LENGTH: 32,

    login(playerId, password) {
        console.log('Attempting to log in player id: ' + playerId);
        return new Promise(function(resolve, reject) {
            AuthService.validateCredentials(playerId, password)
                .then(AuthService.createToken)
                .then(resolve)
                .catch(reject);
        });
    },

    flash(token) {
        console.log('Attempting to re-log player.');
        return new Promise(function(resolve, reject) {
            AuthService.validateTokenCredentials(token)
                .then(resolve)
                .catch(reject);
        });
    },

    createToken(playerId) {
        console.log('Attempting to create token for ' + playerId);
        return new Promise(function(resolve, reject) {
            let payload = {
                playerId: playerId,
                iat: new Date().getTime()
            };
            let options = {
                algorithm: AuthService.JWT_ALGORITHM,
                expiresIn: AuthService.JWT_EXPIRATION_DAYS + 'd'
            };
            try {
                let token = jwt.sign(payload, AuthService.JWT_SECRET_KEY, options);
                console.log('Successfully created a token');
                return resolve(token);
            } catch (err) {
                console.error(err);
                return reject(err);
            }
        });
    },

    verifyToken(token) {
        try {
            return jwt.verify(token, AuthService.JWT_SECRET_KEY);
        } catch (err) {
            console.error(err);
            return false;
        }
    },

    enablePasswordResetByPlayerId(playerId) {
        console.log('Attempting to generate a password reset key.');
        return new Promise(function(resolve, reject) {
            Authorization.findByPlayerId(playerId)
                .then(function(auth) {
                    if (!auth) return reject(new Error('Could not find an authentication record for this player.'));
                    if (!auth.getResetDate()) return auth.enablePasswordReset();

                    let previousResetExpiration = Util.addHours(new Date(auth.getResetDate()), AuthService.PASSWORD_RESET_REPEAT_HOURS);
                    if (previousResetExpiration > new Date()) {
                        return reject(new Error('Cannot reset passwords multiple times within ' + AuthService.PASSWORD_RESET_REPEAT_HOURS + ' hours.'));
                    }
                    return auth.enablePasswordReset();
                })
                .then(resolve)
                .catch(reject);
        });
    },

    resetPasswordByResetKey(password, resetKey) {
        console.log('Attempting to reset a password by reset key.');
        return new Promise(function(resolve, reject) {
            AuthService.validatePasswordStrength(password)
                .then(function () {
                    return Authorization.findByResetKey(resetKey);
                })
                .then(function (auth) {
                    if (!auth) return reject(new Error('Invalid password reset key.'));
                    if (!resetKey) return reject(new Error('A password reset key was not provided.'));
                    if (auth.getResetKey() !== resetKey) return reject(new Error('Invalid password reset key.'));
                    if (!auth.getResetDate()) return auth.setPassword(password);

                    let resetWindowExpiration = Util.addMinutes(auth.getResetDate(), AuthService.PASSWORD_RESET_WINDOW_MINUTES);
                    if (resetWindowExpiration < new Date()) {
                        return reject(new Error('Passwords can only be reset within a ' + AuthService.PASSWORD_RESET_WINDOW_MINUTES + ' minute window.'));
                    }
                    return auth.setPassword(password);
                })
                .then(resolve)
                .catch(reject);
        });
    },

    resetPasswordByExistingPassword(newPassword, existingPassword, playerId) {
        console.log('Attempting to reset password by existing password.');
        return new Promise(function(resolve, reject) {
            AuthService.validatePasswordStrength(newPassword)
                .then(function () {
                    return Authorization.findByPlayerId(playerId);
                })
                .then(function (authorization) {
                    if (!authorization) return reject(new Error('Could not find an authentication record for this player.'));
                    if (!authorization.user.active) return reject(new Error('User has been deactivated.'));
                    if (!authorization.isPasswordEqualTo(existingPassword)) return reject(new Error('Incorrect current password.'));
                    return authorization.setPassword(newPassword);
                })
                .then(resolve)
                .catch(reject);
        });
    },

    validateCredentials(playerId, password) {
        console.log('Validating credentials.');
        return new Promise(function(resolve, reject) {
            Authorization.findByPlayerId(playerId)
                .then(function(authorization) {
                    if (!authorization) return reject(new Error('Could not find an authentication record for this player.'));
                    if (!authorization.user.active) return reject(new Error('User has been deactivated.'));
                    if (authorization.isPasswordEqualTo(password)) return resolve(playerId);
                    return reject(new Error('Incorrect password'));
                })
                .catch(reject);
        });
    },

    validateTokenCredentials(token) {
        console.log('Validating credentials via existing token.');
        return new Promise(function(resolve, reject) {
            let payload = AuthService.verifyToken(token);
            if (!payload) return reject(new Error('Invalid token credential.'));
            return resolve(payload);
        });
    },

    validatePasswordStrength(password) {
        return new Promise(function(resolve, reject) {
            if (password === null || password === undefined) return reject(new Error('Password must be defined.'));
            if (!AuthService.JWT_SECRET_KEY) return  reject(new Error('Application key has not been defined. A ladder administrator must configure this.'));
            if (password.length < AuthService.PASSWORD_MIN_LENGTH) return reject(new Error('Password must be at least ' + AuthService.PASSWORD_MIN_LENGTH + ' characters in length.'));
            if (password.length > AuthService.PASSWORD_MAX_LENGTH) return reject(new Error('Password cannot be longer than ' + AuthService.PASSWORD_MAX_LENGTH + ' characters.'));
            return resolve(password);
        });
    },

    getLogins() {
        return Player.find({active: true}, 'username _id').exec()
            .then(function(players) {
                return players;
            });
    },

    maskEmail(email) {
        let emailParts = email.split('@');
        let maskedName = '';
        emailParts[0].split('').forEach(function(letter, index) {
            maskedName += (index % 2 === 0 ? letter : '*');
        });
        return maskedName + '@' + emailParts[1];
    }
};


module.exports = AuthService;
