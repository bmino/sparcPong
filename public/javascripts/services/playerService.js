angular.module('services')
.service('playerService', function($http, $q) {
	
	// Default Headers
	$http.defaults.headers.delete = { "Content-Type": "application/json;charset=utf-8" };
	
	
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
	
	this.changeName = function(playerId, newName) {
		var request = $http({
			method: "post",
			url: "api/player/change/name/",
			data: {
				playerId: playerId,
				newName: newName
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.changeEmail = function(playerId, newEmail) {
		var request = $http({
			method: "post",
			url: "api/player/change/email/",
			data: {
				playerId: playerId,
				newEmail: newEmail
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.removeEmail = function(playerId) {
		var request = $http({
			method: "post",
			url: "api/player/change/email/remove",
			data: {
				playerId: playerId
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.getAlerts = function(playerId) {
		var request = $http({
			method: "get",
			url: "api/playerAlerts/"+playerId
		});
		return request.then( handleSuccess, handleError );
	};
	
	this.updateAlerts = function(playerId, alerts) {
		var request = $http({
			method: "post",
			url: "api/playerAlerts/",
			data: {
				playerId: playerId,
				alerts: alerts
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
