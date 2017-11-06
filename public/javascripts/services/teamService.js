angular
	.module('services')
	.service('teamService', TeamService);

TeamService.$inject = ['$http'];

function TeamService($http) {
	
	var service = this;
	
	// Default Headers
	$http.defaults.headers.delete = { "Content-Type": "application/json;charset=utf-8" };
	
	
	service.createTeam = function(username, leaderId, partnerId) {
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
	
	service.changeTeamUsername = function(teamId, newUsername) {
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
	
	
	service.getTeam = function(teamId) {
		var request = $http({
			method: "get",
			url: "api/team/fetch/"+teamId
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.getTeams = function() {
		var request = $http({
			method: "get",
			url: "api/team/"
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.lookupTeams = function(playerId) {
		var request = $http({
			method: "get",
			url: "api/team/fetch/lookup/"+playerId
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.getRecord = function(teamId) {
		var request = $http({
			method: "get",
			url: "api/team/record/"+teamId
		});
		return request.then( handleSuccess, handleError );
	};
		
	
	
	
	function handleSuccess(response) {
		return response.data.message;
	}
	
	function handleError(response) {
		var dummy = document.createElement('body');
		dummy.innerHTML = response.data;
		throw dummy.getElementsByTagName("h1")[0].innerHTML;
	}
	
}
