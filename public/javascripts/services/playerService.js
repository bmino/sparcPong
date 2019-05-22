angular
    .module('services')
    .service('playerService', PlayerService);

PlayerService.$inject = ['$http'];

function PlayerService($http) {

    let service = this;

    // Default Headers
    $http.defaults.headers.delete = { "Content-Type": "application/json;charset=utf-8" };


    service.createPlayer = function(username, password, firstName, lastName, email) {
        let request = $http({
            method: "post",
            url: "api/player/",
            data: {
                username: username,
                password: password,
                firstName: firstName,
                lastName: lastName,
                email: email
            }
        });
        return request.then( handleSuccess, handleError );
    };

    service.changeUsername = function(newUsername) {
        let request = $http({
            method: "post",
            url: "api/player/change/username/",
            data: {
                newUsername: newUsername
            }
        });
        return request.then( handleSuccess, handleError );
    };

    service.changePassword = function(oldPassword, newPassword) {
        let request = $http({
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
        let request = $http({
            method: "post",
            url: "api/player/change/email/",
            data: {
                newEmail: newEmail
            }
        });
        return request.then( handleSuccess, handleError );
    };

    service.removeEmail = function() {
        let request = $http({
            method: "post",
            url: "api/player/change/email/remove"
        });
        return request.then( handleSuccess, handleError );
    };

    service.getAlerts = function() {
        let request = $http({
            method: "get",
            url: "api/alerts/"
        });
        return request.then( handleSuccess, handleError );
    };

    service.updateAlerts = function(alerts) {
        let request = $http({
            method: "post",
            url: "api/alerts/",
            data: {
                alerts: alerts
            }
        });
        return request.then( handleSuccess, handleError );
    };


    service.getPlayer = function(playerId) {
        let request = $http({
            method: "get",
            url: "api/player/fetch/"+playerId
        });
        return request.then( handleSuccess, handleError );
    };

    service.getPlayers = function() {
        let request = $http({
            method: "get",
            url: "api/player/"
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
