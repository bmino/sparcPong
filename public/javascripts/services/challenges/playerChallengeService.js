angular
    .module('services')
    .service('playerChallengeService', PlayerChallengeService);

PlayerChallengeService.$inject = ['$http'];

function PlayerChallengeService($http) {

    let service = this;

    // Default Headers
    $http.defaults.headers.delete = { "Content-Type": "application/json;charset=utf-8" };

    service.createChallenge = function(challengeeId) {
        let request = $http({
            method: "post",
            url: "api/challenge/player/",
            data: {
                challengeeId: challengeeId
            }
        });
        return request.then( handleSuccess, handleError );
    };

    service.getChallenges = function(playerId) {
        let request = $http({
            method: "get",
            url: "api/challenge/player/"+playerId
        });
        return request.then( handleSuccess, handleError );
    };

    service.revokeChallenge = function(challengeId) {
        let request = $http({
            method: "delete",
            url: "api/challenge/player/revoke/",
            data: {
                challengeId: challengeId
            }
        });
        return request.then( handleSuccess, handleError );
    };

    service.resolveChallenge = function(challengeId, challengerScore, challengeeScore) {
        let request = $http({
            method: "post",
            url: "api/challenge/player/resolve/",
            data: {
                challengeId: challengeId,
                challengerScore: challengerScore,
                challengeeScore: challengeeScore
            }
        });
        return request.then( handleSuccess, handleError );
    };

    service.forfeitChallenge = function(challengeId) {
        let request = $http({
            method: "post",
            url: "api/challenge/player/forfeit/",
            data: {
                challengeId: challengeId
            }
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