const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Team = mongoose.model('Team');
const NameService = require('./NameService');
const SocketService = require('./SocketService');

const TeamService = {
    PLAYER_TEAMS_MAX: 1,

    createTeam(username, leaderId, partnerId) {
        if (typeof username !== 'string' || username.length === 0) return Promise.reject(new Error('Invalid username data type'));
        if (!leaderId || !partnerId || leaderId === partnerId) return Promise.reject(new Error('Invalid team members'));

        let teamUsername = username ? username.trim() : null;

        let verifyUsername = NameService.verifyUsername(teamUsername);
        let usernameExists = Team.usernameExists(teamUsername);
        let validateLeaderTeamsCount = TeamService.verifyPlayerCanJoinById(leaderId);
        let validatePartnerTeamsCount = TeamService.verifyPlayerCanJoinById(partnerId);
        let validateLeader = Player.findById(leaderId).exec();
        let validatePartner = Player.findById(partnerId).exec();
        let lowestTeamRank = Team.lowestRank();

        return Promise.all([verifyUsername, usernameExists, validateLeaderTeamsCount, validatePartnerTeamsCount, validateLeader, validatePartner, lowestTeamRank])
            .then((values) => {
                let team = new Team();
                team.username = teamUsername;
                team.leader = leaderId;
                team.partner = partnerId;
                team.rank = values[6] + 1;
                return team.save();
            })
            .then(() => {
                SocketService.IO.sockets.emit('team:new', teamUsername);
                console.log('Successfully created a new team.');
            });
    },

    changeTeamName(teamId, newUsername) {
        if (!teamId) return Promise.reject(new Error('You must provide a team id'));

        return NameService.verifyUsername(newUsername)
            .then(Team.usernameExists)
            .then(() => {
                return Team.findById(teamId).exec();
            })
            .then((team) => {
                if (!team) return Promise.reject(new Error('Could not find team'));
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
            Team.getTeamsByPlayerId(playerId)
        ])
            .then((results) => {
                let player = results[0];
                let teams = results[1];
                if (!player) return Promise.reject(new Error('Could not find player'));
                if (!player.active) return Promise.reject(new Error('Deactivated players cannot join a team'));

                let count = teams.length;
                let team_s = TeamService.PLAYER_TEAMS_MAX > 1 ? 'teamss' : 'team';
                console.log(`Found ${count} teams associated with this player.`);
                if (count >= TeamService.PLAYER_TEAMS_MAX) return Promise.reject(new Error(`Players may not be a part of more than ${TeamService.PLAYER_TEAMS_MAX} ${team_s}`));
                return Promise.resolve(count);
            })
            .catch(Promise.reject);
    }
};


module.exports = TeamService;
