angular.module('controllers')
.controller('headerController', ['$scope', '$rootScope', 'playerService', function($scope, $rootScope, playerService) {

	$scope.player;
	
	init();
	
	function init() {
		$rootScope.myClient = {};
		$scope.playerNames = playerService.getPlayers().then(function (players) {
			$scope.players = players;
		});
	}
	
	$scope.selectUser = function(player) {
		$rootScope.myClient.player = player;
		console.log('Set root player to:');
		console.log($rootScope.myClient.player);
	}
	
}]);