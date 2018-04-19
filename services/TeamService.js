var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var Team = mongoose.model('Team');

var TeamService = {
    PLAYER_TEAMS_MAX: 1,

    verifyPlayerCanJoinById : verifyPlayerCanJoinById
};

module.exports = TeamService;

function verifyPlayerCanJoinById(playerId) {
    console.log('Validating if player is a part of too many teams.');
    return Promise.all([
        Player.findById(playerId),
        Team.getTeamsByPlayerId(playerId)
    ])
        .then(function(results) {
            var player = results[0];
            var teams = results[1];
            if (!player) return Promise.reject(new Error('Could not find player'));
            if (!player.active) return Promise.reject(new Error('Deactivated players cannot join a team'));

            var count = teams.length;
            var plural = TeamService.PLAYER_TEAMS_MAX > 1 ? 's' : '';
            console.log('Found ' + count + ' teams associated with this player.');
            if (count >= TeamService.PLAYER_TEAMS_MAX) return Promise.reject(new Error('Players may not be a part of more than ' + TeamService.PLAYER_TEAMS_MAX + ' team' + plural + '.'));
            return Promise.resolve(count);
        })
        .catch(Promise.reject);
}
