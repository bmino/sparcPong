var mongoose = require('mongoose');
var Team = mongoose.model('Team');

var TeamService = {
    PLAYER_TEAMS_MAX: process.env.PLAYER_TEAM_MAX || 1,

    verifyPlayerCanJoinById : verifyPlayerCanJoinById
};

module.exports = TeamService;

function verifyPlayerCanJoinById(playerId) {
    console.log('Validating if player is a part of too many teams.');
    return new Promise(function(resolve, reject) {
        Team.getTeamsByPlayerId(playerId)
            .then(function(teams) {
                var count = teams.length;
                var plural = TeamService.PLAYER_TEAMS_MAX > 1 ? 's' : '';
                console.log('Found ' + count + ' teams associated with this player.');
                if (count >= TeamService.PLAYER_TEAMS_MAX) return reject(new Error('Players may not be a part of more than ' + TeamService.PLAYER_TEAMS_MAX + ' team' + plural + '.'));
                return resolve(count);
            })
            .catch(reject);
    });
}
