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
		var player = $rootScope.player;
		if (!player) {
			alert('You must select your username.');
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
	
	function flash(dom, flashes, duration=150) {
		var bgColor = dom.css('background-color');
		var flashes = flashes * 2;
		var flashed = 0;
		var handle = setInterval(function () {
			dom.css("background-color", function () {
				if(++flashed >= flashes) {
					clearInterval(handle);
				}
				this.switch = !this.switch;
				return this.switch ? "red" : bgColor;
			});
		}, duration)
	}
}]);