angular.module('controllers')
.controller('boardController', ['$scope', '$rootScope', 'playerService', 'challengeService', function($scope, $rootScope, playerService, challengeService) {
	
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
		var player = $rootScope.myClient.player;
		if (!player) {
			alert('You must select your username.');
			// Defined @ globals/functions.js
			flash($(".choose-username"), 3);
		} else {
			var myId = player._id;
			challengeService.createChallenge(myId, challengeeId).then( goodChallenge, badChallenge );
		}
		
	}
	
	function goodChallenge(success) {
		console.log('Challenge issued.');
	}
	
	function badChallenge(error) {
		console.log('Challenge not issued.');
	}
}]);