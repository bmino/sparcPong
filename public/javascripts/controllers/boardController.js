angular.module('controllers')
.controller('boardController', ['$scope', 'playerService', 'challengeService', function($scope, playerService, challengeService) {
	
	init();
	
	function init() {
		$scope.tiers = generateTiers(10);
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
	
	$scope.challenge = function(challengeeId) {
		challengeService.issueChallenge(myId, challengeeId).then( goodChallenge, badChallenge );
	}
	
	function goodChallenge(success) {
		console.log('Challenge issued.');
	}
	
	function badChallenge(error) {
		console.log('Challenge not issued.');
	}
}]);