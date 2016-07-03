angular.module('controllers')
.controller('boardController', ['$scope', '$rootScope', 'socket', 'playerService', 'challengeService', function($scope, $rootScope, socket, playerService, challengeService) {
	
	init();
	
	function init() {
		// TODO: implement a better solution than guessing big at 12 tiers
		generateTiers(12);
		populatePlayers();
	}
	
	function generateTiers(tiers) {
		var arr = [];
		for (var t=1; t<tiers; t++) {
			arr.push(t);
		}
		$scope.tiers = arr;
	}
	
	function populatePlayers() {
		playerService.getPlayers().then( function(players) {
			$scope.players = players;
		});
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
		socket.emit('challenge:issued');
	}
	function badChallenge(error) {
		console.log('Challenge not issued.');
	}
	
	socket.on('challenge:resolved', function(challenge) {
		populatePlayers();
	});
}]);
