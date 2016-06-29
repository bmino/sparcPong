angular.module('services')
.service('challengeService', function($http, $q) {
	this.createChallenge = function(challengerId, challengeeId) {
		var request = $http({
			method: "post",
			url: "api/challenge/",
			data: {
				challengerId: challengerId,
				challengeeId: challengeeId,
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.getChallengesResolved = function(playerId) {
		var request = $http({
			method: "get",
			url: "api/challenge/resolved/"+playerId
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.getChallengesOutgoing = function(playerId) {
		var request = $http({
			method: "get",
			url: "api/challenge/outgoing/"+playerId
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.getChallengesIncoming = function(playerId) {
		var request = $http({
			method: "get",
			url: "api/challenge/incoming/"+playerId
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.revokeChallenge = function(challengerId, challengeeId) {
		var request = $http({
			method: "delete",
			url: "api/challenge/revoke/",
			data: {
				challengerId: challengerId,
				challengeeId: challengeeId
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.resolveChallenge = function(challengerId, challengeeId, challengerScore, challengeeScore) {
		var request = $http({
			method: "post",
			url: "api/challenge/resolve/",
			data: {
				challengerId: challengerId,
				challengeeId: challengeeId,
				challengerScore: challengerScore,
				challengeeScore: challengeeScore
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	
	
	
	function handleSuccess(response) {
		var successMessage = response.data.message;
		return successMessage;
	}
	
	function handleError(response) {
		var dummy = document.createElement('body');
		dummy.innerHTML = response.data;
		var errorMessage = dummy.getElementsByTagName("h1")[0].innerHTML;
		throw errorMessage;
		return null;
	}
	
});