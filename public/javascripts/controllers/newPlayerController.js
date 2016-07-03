angular.module('controllers')
.controller('newPlayerController', ['$scope', 'socket', 'playerService', function($scope, socket, playerService) {

	$scope.player = {
		name: '',
		phone: null,
		email: ''
	};
	
	$scope.createPlayer = function() {
		playerService.createPlayer($scope.player.name, $scope.player.phone, $scope.player.email).then(
			function (success) {
				// Successfully created a new player.
				console.log('Successfully created a new player.');
				alert('Successfully created a new player.');
				socket.emit('player:new', $scope.player);
			},
			function (failure) {
				// Did not create a new player.
				console.log('Did not create a new player.');
				console.log(failure);
			});
	}
}]);