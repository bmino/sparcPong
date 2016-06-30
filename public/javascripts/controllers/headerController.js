angular.module('controllers')
.controller('headerController', ['$scope', 'playerService', function($scope, playerService) {

	$scope.player;
	
	init();
	
	function init() {
		$rootScope.myClient = {};
		populateUserList();
	}
	
	function populateUserList() {
		$scope.playerNames = playerService.getPlayers().then(function (players) {
			// Alphabetize and return
			$scope.players = players.sort(function(a,b) {
				return a.name.localeCompare(b.name);
			});
		});
	}
	
	$scope.selectUser = function(player) {
		$rootScope.myClient.player = player;
		console.log('Set root player to:');
		console.log($rootScope.myClient.player);
	}
	
	$scope.$on('newPlayer', function() {
		populateUserList();
		console.log('New user detected.');
	});
	
}]);