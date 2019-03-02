angular
	.module('controllers')
	.controller('loginController', LoginController);

LoginController.$inject = ['$scope', '$location', 'loginService', 'modalService', 'socket', 'jwtService'];

function LoginController($scope, $location, loginService, modalService, socket, jwtService) {

    $scope.player = {};
    $scope.password = '';
    $scope.players = [];

    function init() {
        populatePlayerList();
        loginService.logout();
    }

    function populatePlayerList() {
        loginService.getLogins()
            .then(function (players) {
                // Alphabetize and return
                $scope.players = players.sort(function(a,b) {
                    return a.username.localeCompare(b.username);
                });
            })
            .catch(angular.noop);
    }

    $scope.signUp = function() {
        $location.path('/signUp/player');
    };

    $scope.forgotPassword = function() {
        let modalOptions = {
            headerText: 'Password Reset',
            bodyText: 'You must first select a username.'
        };

        if (!$scope.player._id) return modalService.showAlertModal({}, modalOptions);

        $scope.resettingPassword = true;
        loginService.enablePasswordReset($scope.player._id)
            .then(function(response) {
                modalOptions.bodyText = response;
                modalService.showAlertModal({}, modalOptions);
            })
            .catch(function(error) {
                modalOptions.bodyText = error;
                modalService.showAlertModal({}, modalOptions);
            })
            .finally(function() {
                $scope.resettingPassword = false;
            });
    };

    $scope.login = function() {
        let modalOptions = {
            headerText: 'Log In Error',
            bodyText: 'You must first select a username.'
        };

        if (!$scope.player._id) return modalService.showAlertModal({}, modalOptions);

        console.log('logging in');
        $scope.authenticating = true;

        socket.emit('login', {
            playerId: $scope.player._id,
            password: $scope.password
        });
    };

    function loginSuccess(token) {
        console.log('login success');
        jwtService.setToken(token);
        jwtService.setHeaders(token);

        // Route to landing page
        $location.path('/');
    }

    function loginFailure(reason) {
        let modalOptions = {
            headerText: 'Log In Error',
            bodyText: reason
        };
        modalService.showAlertModal({}, modalOptions);
        $scope.authenticating = false;
    }

    socket.on('player:new', $scope, populatePlayerList);
    socket.on('player:change:username', $scope, populatePlayerList);

    socket.on('login:success', $scope, loginSuccess);
    socket.on('login:error', $scope, loginFailure);

    init();

}
