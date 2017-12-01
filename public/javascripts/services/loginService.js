angular
    .module('services')
    .service('loginService', LoginService);

LoginService.$inject = ['$http', 'socket', 'jwtService'];

function LoginService($http, socket, jwtService) {

    var service = this;
    
    /**
     * Authenticates a username and password.
     *
     * @param playerId
     * @param password
     */
    service.createToken = function (playerId, password) {
        var request = $http({
            method: 'post',
            url: 'auth/login/',
            data: {
                playerId: playerId,
                password: password
            }
        });
        return request.then(processSuccessToken, processError);
    };

    /**
     * Registers a potentially already authenticated user.
     *
     * @param token
     */
    service.flashToken = function (token) {
        var request = $http({
            method: 'post',
            url: 'auth/flash/',
            data: {
                token: token
            }
        });
        return request.then(processSuccessToken, processError);
    };

    /**
     * Allows a user to reset their password via reset key.
     * @param playerId
     */
    service.enablePasswordReset = function(playerId) {
        var request = $http({
            method: "post",
            url: "auth/password/reset/enable",
            data: {
                playerId: playerId
            }
        });
        return request.then(processSuccess, processError);
    };

    service.changePasswordWithResetKey = function(newPassword, resetKey) {
        var request = $http({
            method: "post",
            url: "auth/password/reset/change",
            data: {
                password: newPassword,
                resetKey: resetKey
            }
        });
        return request.then(processSuccess, processError);
    };

    service.getLogins = function () {
        var request = $http({
            method: 'get',
            url: 'auth/logins/'
        });
        return request.then(processSuccess, processError);
    };

    service.attemptRelogin = function () {
        if (!service.isLoggedIn()) return;

        console.log('Attempting to flash token from previous session.');
        service.flashToken(jwtService.getToken())
            .then(service.setHeaders)
            .then(function() {
                console.log('Successfully flashed token from previous session.');
            })
            .catch(angular.noop);
    };

    service.logout = function () {
        console.log('Removing token and headers');
        if (service.isLoggedIn()) socket.emit('logout', jwtService.getDecodedToken().playerId);
        jwtService.removeToken();
        jwtService.clearHeaders();
    };

    service.isLoggedIn = function () {
        var token = jwtService.getToken();
        return token !== null && token !== undefined;
    };

    function processSuccess(response) {
        return response.data.message;
    }

    function processSuccessToken(response) {
        var token = response.data.token;
        jwtService.setToken(token);
        jwtService.setHeaders(token);
        return token;
    }

    function processError(response) {
        throw response.data;
    }

}
