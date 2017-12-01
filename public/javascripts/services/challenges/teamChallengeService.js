angular
	.module('services')
	.service('teamChallengeService', TeamChallengeService);

TeamChallengeService.$inject = ['$http'];

function TeamChallengeService($http) {
	
	var service = this;
	
	// Default Headers
	$http.defaults.headers.delete = { "Content-Type": "application/json;charset=utf-8" };
	
	service.createChallenge = function(challengerId, challengeeId) {
		var request = $http({
			method: "post",
			url: "api/challenge/team",
			data: {
				challengerId: challengerId,
				challengeeId: challengeeId
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.getChallenges = function(playerId) {
		var request = $http({
			method: "get",
			url: "api/challenge/team/"+playerId
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.revokeChallenge = function(challengeId) {
		var request = $http({
			method: "delete",
			url: "api/challenge/team/revoke/",
			data: {
                challengeId: challengeId
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.resolveChallenge = function(challengeId, challengerScore, challengeeScore) {
		var request = $http({
			method: "post",
			url: "api/challenge/team/resolve/",
			data: {
				challengeId: challengeId,
				challengerScore: challengerScore,
				challengeeScore: challengeeScore
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.forfeitChallenge = function(challengeId) {
		var request = $http({
			method: "post",
			url: "api/challenge/team/forfeit/",
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