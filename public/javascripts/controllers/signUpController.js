angular.module('controllers')
.controller('signUpController', ['$scope', 'socket', 'modalService', 'playerService', 'teamService', function($scope, socket, modalService, playerService, teamService) {
	
	$scope.players = [];
	
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
	
	function init() {
		$scope.loadingPlayers = true;
		loadPlayers();
	}
	
	function loadPlayers() {
		$scope.loadingPlayers = true;
		playerService.getPlayers().then( function(players) {
			$scope.players = players;
			$scope.loadingPlayers = false;
		});
	}
	
	$scope.createPlayer = function() {
		playerService.createPlayer($scope.player.username, $scope.player.firstName, $scope.player.lastName, $scope.player.phone, $scope.player.email).then(
			function (success) {
				// Successfully created a new player.
				// Clear inputs
				$scope.player = {
					username: '',
					firstName: '',
					lastName: '',
					phone: null,
					email: ''
				};
				
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
	};
	
	$scope.createTeam = function() {
		if (!$scope.team.leader || !$scope.team.partner) return;
		teamService.createTeam($scope.team.username, $scope.team.leader._id, $scope.team.partner._id).then(
			function(success) {
				// Successfully created a new team.
				// Clear inputs
				$scope.team = {
					username: '',
					leader: null,
					partner: null
				};
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
	};

}]);
