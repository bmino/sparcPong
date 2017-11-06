angular
	.module('controllers')
	.controller('signUpPlayerController', SignUpPlayerController);

SignUpPlayerController.$inject = ['$scope', '$location', 'modalService', 'playerService'];

function SignUpPlayerController($scope, $location, modalService, playerService) {

	$scope.player = {
		username: '',
		password: '',
		firstName: '',
		lastName: '',
		phone: null,
		email: ''
	};

	$scope.goToLogin = function() {
	    $location.path('/login');
    };

	$scope.createPlayer = function() {
		playerService.createPlayer($scope.player.username, $scope.player.password, $scope.player.firstName, $scope.player.lastName, $scope.player.phone, $scope.player.email)
			.then(creationSuccess, creationError);
	};

	function creationSuccess(response) {
        clearInputs();

        var modalOptions = {
            headerText: 'New Player',
            bodyText: response
        };
        modalService.showAlertModal({}, modalOptions);
	}

    function creationError(response) {
        var modalOptions = {
            headerText: 'New Player',
            bodyText: response
        };
        modalService.showAlertModal({}, modalOptions);
    }

    function clearInputs() {
        $scope.player = {
            username: '',
            firstName: '',
            lastName: '',
            phone: null,
            email: ''
        };
	}

}
