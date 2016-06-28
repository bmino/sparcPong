angular.module('controllers')
.controller('newPlayerController', ['$scope', 'playerService', function($scope, playerService) {
	$scope.test = 'sample controller';
	$scope.player = {
		name: '',
		phone: null,
		email: ''
	};
	
	$scope.verifyPlayer = function() {
		playerService.countPlayers($scope.player.name).then(createPlayer, invalidPlayer);
	};
	
	function createPlayer() {
		playerService.createPlayer($scope.player.name, $scope.player.phone, $scope.player.email).then(
			function (success) {
				// Succesfully created a new player.
				console.log('Succesfully created a new player.');
				alert('Succesfully created a new player.');
			},
			function (failure) {
				// Did not create a new player.
				console.log('Did not create a new player.');
				console.log(failure);
			});
	}
	
	function invalidPlayer() {
		// This player name is already in use
		console.log('This player name is already in use.');
		alert('This player name is already in use.');
	}
}]);