angular.module('controllers')
.controller('newPlayerController', ['$scope', function($scope) {
	$scope.test = 'sample controller';
	$scope.player = {
		name: '',
		phone: null,
		email: ''
	};
	
	$scope.createPlayer = function() {
		
	};
	
	function validatePlayer(player) {
		
	}
}]);