angular
	.module('services')
	.service('playerService', PlayerService);

PlayerService.$inject = ['$http'];

function PlayerService($http) {
	
	var service = this;
	
	// Default Headers
	$http.defaults.headers.delete = { "Content-Type": "application/json;charset=utf-8" };
	
	
	service.createPlayer = function(username, password, firstName, lastName, phone, email) {
		var request = $http({
			method: "post",
			url: "api/player/",
			data: {
				username: username,
				password: password,
				firstName: firstName,
				lastName: lastName,
				phone: phone,
				email: email
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.changeUsername = function(newUsername) {
		var request = $http({
			method: "post",
			url: "api/player/change/username/",
			data: {
				newUsername: newUsername
			}
		});
		return request.then( handleSuccess, handleError );
	};

    service.changePassword = function(oldPassword, newPassword) {
        var request = $http({
            method: "post",
            url: "api/player/change/password/",
            data: {
            	oldPassword: oldPassword,
                newPassword: newPassword
            }
        });
        return request.then( handleSuccess, handleError );
    };
	
	service.changeEmail = function(newEmail) {
		var request = $http({
			method: "post",
			url: "api/player/change/email/",
			data: {
				newEmail: newEmail
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.removeEmail = function() {
		var request = $http({
			method: "post",
			url: "api/player/change/email/remove"
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.getAlerts = function() {
		var request = $http({
			method: "get",
			url: "api/playerAlerts/"
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.updateAlerts = function(alerts) {
		var request = $http({
			method: "post",
			url: "api/playerAlerts/",
			data: {
				alerts: alerts
			}
		});
		return request.then( handleSuccess, handleError );
	};
	
	
	service.getPlayer = function(playerId) {
		var request = $http({
			method: "get",
			url: "api/player/fetch/"+playerId
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.getPlayers = function() {
		var request = $http({
			method: "get",
			url: "api/player/"
		});
		return request.then( handleSuccess, handleError );
	};
	
	service.getRecord = function(playerId) {
		var request = $http({
			method: "get",
			url: "api/player/record/"+playerId
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
