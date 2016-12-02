angular.module('controllers')
.controller('signUpController', ['$scope', 'socket', 'modalService', 'playerService', function($scope, socket, modalService, playerService) {

	$scope.player = {
		username: '',
		firstName: '',
		lastName: '',
		phone: null,
		email: ''
	};
	
	$scope.team = {
		username: '',
		leader: null,
		partner: null
	};
	
	init();
	
	function init() {}
	
	$scope.createPlayer = function() {
		playerService.createPlayer($scope.player.username, $scope.player.firstName, $scope.player.lastName, $scope.player.phone, $scope.player.email).then(
			function (success) {
				// Successfully created a new player.
				var modalOptions = {
					headerText: 'New Player',
					bodyText: success
				};
				modalService.showAlertModal({}, modalOptions);
			},
			function (failure) {
				// Did not create a new player.
				console.log(failure);
				var modalOptions = {
					headerText: 'New Player',
					bodyText: failure
				};
				modalService.showAlertModal({}, modalOptions);
			}
		);
	}
	
	$scope.createTeam = function() {
		teamService.createTeam($scope.team.username, $scope.team.leader, $scope.team.partner).then(
			function(success) {
				// Successfully created a new team.
				var modalOptions = {
					headerText: 'New Team',
					bodyText: success
				};
				modalService.showAlertModal({}, modalOptions);
			},
			function (failure) {
				// Did not create a new team.
				console.log(failure);
				var modalOptions = {
					headerText: 'New Team',
					bodyText: failure
				};
				modalService.showAlertModal({}, modalOptions);
			}
		);
	}
}]);
