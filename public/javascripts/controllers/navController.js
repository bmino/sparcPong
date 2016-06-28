angular.module('controllers')
.controller('navController', ['$scope', '$rootScope', 'playerService', function($scope, $rootScope, playerService) {

	$scope.player;
	
	init();
	
	function init() {
		$rootScope.player = null;
		$scope.playerNames = playerService.getPlayers().then(function (players) {
			$scope.players = players;
		});
	}
	
	$scope.selectUser = function(player) {
		$rootScope.player = player;
		console.log('Set root player to:');
		console.log($rootScope.player);
	}
	
}]);