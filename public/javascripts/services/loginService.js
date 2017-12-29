angular
    .module('services')
    .service('loginService', LoginService);

LoginService.$inject = ['$http', 'socket', 'jwtService'];

function LoginService($http, socket, jwtService) {

    var service = this;

    service.enablePasswordReset = function(playerId) {
        var request = $http({
            method: 'post',
            url: 'auth/password/reset/enable',
            data: {
                playerId: playerId
            }
        });
        return request.then(processSuccess, processError);
    };

    service.changePasswordWithResetKey = function(newPassword, resetKey) {
        var request = $http({
            method: 'post',
            url: 'auth/password/reset/change',
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
            url: 'auth/logins'
        });
        return request.then(processSuccess, processError);
    };

    service.attemptRelogin = function () {
        console.log('Attempting relogin');
        if (!service.isLoggedIn()) return;
        var currentToken = jwtService.getToken();
        jwtService.setHeaders(currentToken);
        socket.emit('flash', currentToken);
    };

    service.logout = function () {
        console.log('Removing token and headers');
        if (service.isLoggedIn()) {
            socket.emit('logout', jwtService.getDecodedToken().playerId);
        }

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

    function processError(response) {
        throw response.data;
    }

    socket.on('flash:success', null, jwtService.setHeaders);
    socket.on('flash:error', null, console.error);

}
