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
		email: ''
	};
	$scope.confirmPassword = '';

	$scope.goToLogin = function() {
	    $location.path('/login');
    };

	$scope.createPlayer = function() {
        let modalOptions = {
            headerText: 'New Player',
            bodyText: 'Password confirmation does not match'
        };
        if ($scope.player.password !== $scope.confirmPassword) return modalService.showAlertModal({}, modalOptions);

		playerService.createPlayer($scope.player.username, $scope.player.password, $scope.player.firstName, $scope.player.lastName, $scope.player.email)
			.then(creationSuccess, creationError);
	};

	function creationSuccess(response) {
        clearInputs();

        let modalOptions = {
            headerText: 'New Player',
            bodyText: response
        };
        modalService.showAlertModal({}, modalOptions);
	}

    function creationError(response) {
        let modalOptions = {
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
            email: ''
        };
        $scope.confirmPassword = '';
	}

}
