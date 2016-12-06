angular.module('services')
.service('teamService', function($http, $q) {
	
	// Default Headers
	$http.defaults.headers.delete = { "Content-Type": "application/json;charset=utf-8" };
	
	
	this.createTeam = function(username, leaderId, partnerId) {
		var request = $http({
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
	
	this.changeTeamUsername = function(teamId, newUsername) {
		var request = $http({
			method: "post",
			url: "api/team/change/username/",
			data: {
				teamId: teamId,
				newUsername: newUsername
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	
	this.getTeam = function(teamId) {
		var request = $http({
			method: "get",
			url: "api/team/fetch/"+teamId
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.getTeams = function() {
		var request = $http({
			method: "get",
			url: "api/team/"
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.lookupTeams = function(playerId) {
		var request = $http({
			method: "get",
			url: "api/team/fetch/lookup/"+playerId
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.getRecord = function(teamId) {
		var request = $http({
			method: "get",
			url: "api/team/record/"+teamId
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
