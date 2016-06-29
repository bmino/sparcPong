angular.module('services')
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
		return request.then( handleSuccess, handleError );
	};
	
	
	this.getPlayer = function(playerId) {
		var request = $http({
			method: "get",
			url: "api/player/fetch/"+playerId
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.getPlayers = function() {
		var request = $http({
			method: "get",
			url: "api/player/"
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.countPlayers = function(playerName) {
		var request = $http({
			method: "get",
			url: "api/player/count/"+playerName
		});
		return request.then( handleSuccess, handleError );
	}
	
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