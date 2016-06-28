angular.module('controllers')
.controller('boardController', ['$scope', 'playerService', function($scope, playerService) {
	
	$scope.tiers = generateTiers(5);
	
	init();
	
	function init() {
		playerService.getPlayers().then( function(players) {
			$scope.players = players;
		});
	}
	
	function generateTiers(tiers) {
		var arr = [];
		for (var t=1; t<tiers; t++) {
			arr.push(t);
		}
		return arr;
	}
}]);