angular
	.module('controllers')
	.controller('loginController', LoginController);

LoginController.$inject = ['$scope', '$location', 'loginService', 'modalService', 'socket'];

function LoginController($scope, $location, loginService, modalService, socket) {

    $scope.player = {};
    $scope.password = '';
    $scope.players = [];
    $scope.rememberMe = false;

    function init() {
        $scope.authenticating = false;
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

    $scope.login = function() {
        console.log('logging in');
        $scope.authenticating = true;
        loginService.createToken($scope.player._id, $scope.password)
            .then( loginSuccess, loginFailure )
            .finally(function() {
                $scope.authenticating = false;
            });
    };

    function loginSuccess() {
        console.log('login success');
        // Route to landing page
        $location.path('/');
    }

    function loginFailure() {
        var modalOptions = {
            headerText: 'Log In',
            bodyText: 'Error logging in'
        };
        modalService.showAlertModal({}, modalOptions);
    }

    socket.on('player:new', populatePlayerList);
    socket.on('player:change:username', populatePlayerList);

    init();

}
