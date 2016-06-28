angular.module('controllers')
.service('playerService', function($http, $q) {
	this.createPlayer = function(name, phone, email) {
		var request = $http({
			method: "post",
			url: "api/player/",
			data: {
				name: name,
				phone: phone,
				email: email
			}
		});
		return request.then( handleSuccess, handleError);
	};
	
	this.getPlayers = function() {
		var request = $http({
			method: "get",
			url: "api/player/"
		});
		return request.then( handleSuccess, handleError);
	};
	
	this.updatePlayer = function(fill) {
		// TODO: implement with PUT
	};
	
	this.deletePlayer = function(playerId) {
		var request = $http({
			method: "delete",
			url: "api/player/",
			data: {
				playerId: playerId
			}
		});
		return request.then( handleSuccess, handleError);
	};
	
	
	
	
	
	function handleSuccess(response) {
		return response.data;
	}
	
	function handleError(response) {
		// TODO: Check for consistent error
		return response.data.
	}
	
});