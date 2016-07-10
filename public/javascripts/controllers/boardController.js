angular.module('controllers')
.controller('boardController', ['$scope', '$rootScope', 'socket', 'modalService', 'playerService', 'challengeService', function($scope, $rootScope, socket, modalService, playerService, challengeService) {
	
	init();
	
	function init() {
		$rootScope.pageTitle = 'Board';
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
			var modalOptions = {
				actionButtonText: 'OK',
				headerText: 'Challenge',
				bodyText: 'You must sign in first.'
			};
			modalService.showAlertModal({}, modalOptions).then(function(result) {
				// Defined @ globals/functions.js
				flash($("#signInOut"), 2);
			});
		} else {
			var myId = player._id;
			challengeService.createChallenge(myId, challengeeId).then( goodChallenge, badChallenge );
		}
	}
	function goodChallenge(success) {
		console.log('Challenge issued.');
		socket.emit('challenge:issued');
		var modalOptions = {
            headerText: 'Challenge',
            bodyText: success
        };
        modalService.showAlertModal({}, modalOptions);
	}
	function badChallenge(error) {
		console.log('Challenge not issued.');
		var modalOptions = {
            headerText: 'Challenge',
            bodyText: error
        };
        modalService.showAlertModal({}, modalOptions);
	}
	
	socket.on('player:new', function(player) {
		populatePlayers();
	});
	socket.on('challenge:resolved', function(challenge) {
		populatePlayers();
	});
	socket.on('challenge:forfeited', function(challenge) {
		populatePlayers();
	});
}]);
