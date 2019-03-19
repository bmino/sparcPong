const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Team = mongoose.model('Team');
const NameService = require('./NameService');
const SocketService = require('./SocketService');

const TeamService = {

    createTeam(username, leaderId, partnerId, clientId) {
        if (!leaderId || !partnerId || leaderId === partnerId) return Promise.reject(new Error('Invalid team members'));
        if (clientId !== leaderId && clientId !== partnerId) return Promise.reject(new Error('You must be a member of a created team'));

        return Promise.all([
            Team.lowestRank(),
            NameService.verifyUsername(username),
            Team.usernameExists(username),
            TeamService.verifyPlayerCanJoinById(leaderId),
            TeamService.verifyPlayerCanJoinById(partnerId),
            Player.findById(leaderId).exec(),
            Player.findById(partnerId).exec(),
        ])
            .then(([rank, ...results]) => {
                let team = new Team();
                team.username = username;
                team.leader = leaderId;
                team.partner = partnerId;
                team.rank = rank + 1;
                return team.save();
            })
            .then(() => {
                SocketService.IO.sockets.emit('team:new', username);
                console.log('Successfully created a new team.');
            });
    },

    changeTeamName(teamId, newUsername, clientId) {
        return NameService.verifyUsername(newUsername)
            .then(Team.usernameExists)
            .then(() => Team.findById(teamId).exec())
            .then((team) => {
                if (!team) return Promise.reject(new Error('Could not find team'));
                if (clientId.toString() !== team.leader.toString()) return Promise.reject(new Error('Only the team leader can update the team name'));
                console.log('Changing team username.');
                team.username = newUsername;
                return team.save();
            })
            .then(() => {
                SocketService.IO.sockets.emit('team:change:username');
            });
    },

    verifyPlayerCanJoinById(playerId) {
        console.log('Validating if player is a part of too many teams.');

        return Promise.all([
            Player.findById(playerId),
            Team.getTeamByPlayerId(playerId)
        ])
            .then(([player, team]) => {
                if (!player) return Promise.reject(new Error('Could not find player'));
                if (!player.active) return Promise.reject(new Error('Deactivated players cannot join a team'));
                if (team) return Promise.reject(new Error(`Players may not be a part of more than one team`));
                return Promise.resolve(playerId);
            });
    }
};


module.exports = TeamService;
