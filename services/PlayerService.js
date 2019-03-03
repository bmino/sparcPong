const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Alert = mongoose.model('Alert');
const Authorization = mongoose.model('Authorization');
const AuthService = require('./AuthService');
const EmailService = require('./EmailService');
const NameService = require('./NameService');
const SocketService = require('./SocketService');

const TeamService = {
    PLAYER_TEAMS_MAX: 1,

    createPlayer(username, password, firstName, lastName, phone, email) {
        let player = new Player();
        player.username = username;
        player.firstName = firstName;
        player.lastName = lastName;
        player.phone = phone;
        player.email = email;

        return Promise.all([
            AuthService.validatePasswordStrength(password),
            NameService.verifyRealName(firstName, lastName),
            NameService.verifyUsername(username),
            Player.usernameExists(username),
            EmailService.verifyEmail(email),
            Player.emailExists(email),
            Player.lowestRank()
        ])
            .then(function(values) {
                // Set initial rank and persist player
                player.rank = values[6] + 1;
                return player.save();
            })
            .then(Alert.attachToPlayer)
            .then(function(createdPlayer) {
                return Authorization.attachToPlayerWithPassword(createdPlayer, password)
            })
            .then(function() {
                SocketService.IO.sockets.emit('player:new', username);
                console.log('Successfully created a new player.');
            });
    },

    changeUsername(newUsername, clientId) {
        if (!clientId) return Promise.reject(new Error('You must provide a valid player id.'));

        return NameService.verifyUsername(newUsername)
            .then(Player.usernameExists)
            .then(function() {
                return Player.findById(clientId).exec()
            })
            .then(function(player) {
                if (!player) return Promise.reject(new Error('Could not find your account.'));
                player.username = newUsername;
                return player.save();
            })
            .then(function() {
                SocketService.IO.sockets.emit('player:change:username');
            });
    },

    changePassword(oldPassword, newPassword, clientId) {
        if (!clientId) return Promise.reject(new Error('You must provide a valid player id.'));

        return AuthService.resetPasswordByExistingPassword(newPassword, oldPassword, clientId)
            .then(function() {
                SocketService.IO.sockets.emit('player:change:password');
            });
    },

    changeEmail(newEmail, clientId) {
        if (!clientId) return Promise.reject(new Error('You must provide a valid player id.'));
        if (!newEmail || newEmail.length === 0) return Promise.reject(new Error('You must provide an email address.'));
        if (newEmail.length > 50) return Promise.reject(new Error('Your email length cannot exceed 50 characters.'));

        return EmailService.verifyEmail(newEmail)
            .then(Player.emailExists)
            .then(function() {
                return Player.findById(clientId).exec();
            })
            .then(function(player) {
                if (!player) return Promise.reject(new Error('Could not find your current account.'));
                console.log('Changing player email.');
                player.email = newEmail;
                return player.save();
            })
            .then(function() {
                SocketService.IO.sockets.emit('player:change:email');
            });
    },

    removeEmail(clientId) {
        if (!clientId) return Promise.reject(new Error('You must provide a valid player id.'));

        return Player.findById(clientId).exec()
            .then(function(player) {
                if (!player) return Promise.reject(new Error('Could not find your current account.'));
                player.email = '';
                return player.save();
            })
            .then(function() {
                SocketService.IO.sockets.emit('player:change:email');
            });
    }
    
};


module.exports = TeamService;
