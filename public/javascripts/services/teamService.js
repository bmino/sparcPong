angular
    .module('services')
    .service('teamService', TeamService);

TeamService.$inject = ['$http'];

function TeamService($http) {

    let service = this;

    // Default Headers
    $http.defaults.headers.delete = { "Content-Type": "application/json;charset=utf-8" };


    service.createTeam = function(username, leaderId, partnerId) {
        let request = $http({
            method: "post",
            url: "api/team/",
            data: {
                username: username,
                leaderId: leaderId,
                partnerId: partnerId
            }
        });
        return request.then( handleSuccess, handleError );
    };

    service.changeTeamUsername = function(teamId, newUsername) {
        let request = $http({
            method: "post",
            url: "api/team/change/username/",
            data: {
                teamId: teamId,
                newUsername: newUsername
            }
        });
        return request.then( handleSuccess, handleError );
    };


    service.getTeam = function(teamId) {
        let request = $http({
            method: "get",
            url: "api/team/fetch/"+teamId
        });
        return request.then( handleSuccess, handleError );
    };

    service.getTeams = function() {
        let request = $http({
            method: "get",
            url: "api/team/"
        });
        return request.then( handleSuccess, handleError );
    };

    service.lookupTeamByPlayerId = function(playerId) {
        let request = $http({
            method: "get",
            url: "api/team/fetch/byPlayerId/"+playerId
        });
        return request.then( handleSuccess, handleError );
    };


    function handleSuccess(response) {
        return response.data.message;
    }

    function handleError(response) {
        throw response.data;
    }

}
