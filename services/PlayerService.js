const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Alert = mongoose.model('Alert');
const Authorization = mongoose.model('Authorization');
const AuthService = require('./AuthService');
const EmailService = require('./EmailService');
const NameService = require('./NameService');
const SocketService = require('./SocketService');

const PlayerService = {

    createPlayer(username, password, firstName, lastName, email) {
        return Promise.all([
            Player.lowestRank(),
            AuthService.validatePasswordStrength(password),
            NameService.verifyRealName(firstName, lastName),
            NameService.verifyUsername(username),
            Player.usernameExists(username),
            EmailService.verifyEmail(email),
            Player.emailExists(email)
        ])
            .then((values) => {
                let player = new Player();
                player.username = username;
                player.firstName = firstName;
                player.lastName = lastName;
                player.email = email;
                player.rank = values[0] + 1;
                return player.save();
            })
            .then(Alert.attachToPlayer)
            .then((createdPlayer) => Authorization.attachToPlayerWithPassword(createdPlayer, password))
            .then(() => {
                SocketService.IO.sockets.emit('player:new', username);
                console.log('Successfully created a new player.');
            });
    },

    changeUsername(newUsername, clientId) {
        if (!clientId) return Promise.reject(new Error('You must provide a valid player id'));

        return NameService.verifyUsername(newUsername)
            .then(Player.usernameExists)
            .then(() => Player.findById(clientId).exec())
            .then((player) => {
                if (!player) return Promise.reject(new Error('Could not find your account'));
                player.username = newUsername;
                return player.save();
            })
            .then(() => {
                SocketService.IO.sockets.emit('player:change:username');
            });
    },

    changePassword(oldPassword, newPassword, clientId) {
        if (!clientId) return Promise.reject(new Error('You must provide a valid player id'));

        return AuthService.resetPasswordByExistingPassword(newPassword, oldPassword, clientId)
            .then(() => {
                SocketService.IO.sockets.emit('player:change:password');
            });
    },

    changeEmail(newEmail, clientId) {
        if (!clientId) return Promise.reject(new Error('You must provide a valid player id'));

        return EmailService.verifyEmail(newEmail)
            .then(Player.emailExists)
            .then(() => Player.findById(clientId).exec())
            .then((player) => {
                if (!player) return Promise.reject(new Error('Could not find your current account'));
                console.log('Changing player email.');
                player.email = newEmail;
                return player.save();
            })
            .then(() => {
                SocketService.IO.sockets.emit('player:change:email');
            });
    },

    removeEmail(clientId) {
        if (!clientId) return Promise.reject(new Error('You must provide a valid player id'));

        return Player.findById(clientId).exec()
            .then((player) => {
                if (!player) return Promise.reject(new Error('Could not find your current account'));
                player.email = '';
                return player.save();
            })
            .then(() => {
                SocketService.IO.sockets.emit('player:change:email');
            });
    }
    
};


module.exports = PlayerService;
