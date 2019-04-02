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
        console.log(`Attempting to log in player id: ${playerId}`);
        return AuthService.validateCredentials(playerId, password)
            .then(AuthService.createToken);
    },

    flash(token) {
        console.log('Attempting to re-log player.');
        return AuthService.validateTokenCredentials(token);
    },

    createToken(playerId) {
        console.log(`Attempting to create token for ${playerId}`);
        const payload = {
            playerId: playerId,
            iat: new Date().getTime()
        };
        const options = {
            algorithm: AuthService.JWT_ALGORITHM,
            expiresIn: AuthService.JWT_EXPIRATION_DAYS + 'd'
        };
        try {
            const token = jwt.sign(payload, AuthService.JWT_SECRET_KEY, options);
            console.log('Successfully created a token');
            return Promise.resolve(token);
        } catch (err) {
            console.error(err);
            return Promise.reject(err);
        }
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
        return Authorization.findByPlayerId(playerId)
            .then((auth) => {
                if (!auth) return Promise.reject(new Error('Could not find an authentication record for this player'));
                if (!auth.reset.date) return auth.enablePasswordReset();

                let previousResetExpiration = Util.addHours(new Date(auth.reset.date), AuthService.PASSWORD_RESET_REPEAT_HOURS);
                if (previousResetExpiration > new Date()) {
                    return Promise.reject(new Error(`Cannot reset passwords multiple times within ${AuthService.PASSWORD_RESET_REPEAT_HOURS} hours`));
                }
                return auth.enablePasswordReset();
            });
    },

    resetPasswordByResetKey(password, resetKey) {
        console.log('Attempting to reset a password by reset key.');
        return AuthService.validatePasswordStrength(password)
            .then(() => Authorization.findByResetKey(resetKey))
            .then((auth) => {
                if (!auth) return Promise.reject(new Error('Invalid password reset key'));
                if (!resetKey) return Promise.reject(new Error('A password reset key was not provided'));
                if (auth.reset.key !== resetKey) return Promise.reject(new Error('Invalid password reset key'));
                if (!auth.reset.date) return auth.setPassword(password);

                let resetWindowExpiration = Util.addMinutes(auth.reset.date, AuthService.PASSWORD_RESET_WINDOW_MINUTES);
                if (resetWindowExpiration < new Date()) {
                    return Promise.reject(new Error(`Passwords can only be reset within a ${AuthService.PASSWORD_RESET_WINDOW_MINUTES} minute window`));
                }
                return auth.setPassword(password);
            });
    },

    resetPasswordByExistingPassword(newPassword, existingPassword, playerId) {
        console.log('Attempting to reset password by existing password.');
        return AuthService.validatePasswordStrength(newPassword)
            .then(() => Authorization.findByPlayerId(playerId))
            .then((authorization) => {
                if (!authorization) return Promise.reject(new Error('Could not find an authentication record for this player'));
                if (!authorization.user.active) return Promise.reject(new Error('User has been deactivated'));
                if (!authorization.isPasswordEqualTo(existingPassword)) return Promise.reject(new Error('Incorrect current password'));
                return authorization.setPassword(newPassword);
            });
    },

    validateCredentials(playerId, password) {
        console.log('Validating credentials.');
        return Authorization.findByPlayerId(playerId)
            .then((authorization) => {
                if (!authorization) return Promise.reject(new Error('Could not find an authentication record for this player'));
                if (!authorization.user.active) return Promise.reject(new Error('User has been deactivated'));
                if (!authorization.isPasswordEqualTo(password)) return Promise.reject(new Error('Incorrect password'));
                return Promise.resolve(playerId);
            });
    },

    validateTokenCredentials(token) {
        console.log('Validating credentials via existing token.');
        const payload = AuthService.verifyToken(token);
        if (!payload) return Promise.reject(new Error('Invalid token credential'));
        return Promise.resolve(payload);
    },

    validatePasswordStrength(password) {
        if (password === null || password === undefined) return Promise.reject(new Error('Password must be defined'));
        if (!AuthService.JWT_SECRET_KEY) return Promise.reject(new Error('Application key has not been defined. A ladder administrator must configure this'));
        if (password.length < AuthService.PASSWORD_MIN_LENGTH) return Promise.reject(new Error(`Password must be at least ${AuthService.PASSWORD_MIN_LENGTH} characters in length`));
        if (password.length > AuthService.PASSWORD_MAX_LENGTH) return Promise.reject(new Error(`Password cannot be longer than ${AuthService.PASSWORD_MAX_LENGTH} characters`));
        return Promise.resolve(password);
    },

    getLogins() {
        return Player.find({active: true}, 'username _id').exec();
    },

    maskEmail(email) {
        const emailParts = email.split('@');
        let maskedName = '';
        emailParts[0].split('').forEach((letter, index) => {
            maskedName += (index % 2 === 0 ? letter : '*');
        });
        return `${maskedName}@${emailParts[1]}`;
    }
};


module.exports = AuthService;
