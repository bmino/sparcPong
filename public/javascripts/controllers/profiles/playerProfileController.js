angular
	.module('controllers')
	.controller('playerProfileController', PlayerProfileController);

PlayerProfileController.$inject = ['$scope', '$routeParams', 'jwtService', 'socket', 'playerService', 'playerChallengeService'];

function PlayerProfileController($scope, $routeParams, jwtService, socket, playerService, playerChallengeService) {
	
	var profileId;
	$scope.challenges = {
		incoming: [],
		outgoing: [],
		resolved: []
	};
	
	$scope.loadingProfile = true;
	$scope.loadingChallenges = true;
	$scope.loadingRecord = true;

	function init() {
		profileId = $routeParams.id;
		if (!profileId) {
			console.log('No profile id detected.');
			profileId = jwtService.getDecodedToken().playerId;
		}
		
		loadPlayer();
		fetchChallenges();
		getRecord();
	}
	
	function loadPlayer() {
		playerService.getPlayer(profileId).then(function(player) {
			if (!player) {
				console.log('Could not fetch profile');
				$scope.loadingProfile = false;
			} else {
				$scope.profile = player;
				$scope.loadingProfile = false;
			}
		});
	}
	
	function fetchChallenges() {
		playerChallengeService.getChallenges(profileId).then( sortChallenges );
	}
	function sortChallenges(challenges) {
		$scope.challenges.resolved = challenges.resolved;
		$scope.challenges.outgoing = challenges.outgoing;
		$scope.challenges.incoming = challenges.incoming;
		$scope.loadingChallenges = false;
	}
	
	function getRecord() {
		playerService.getRecord(profileId)
			.then(function(data) {
				if (data) {
					$scope.wins = data.wins;
					$scope.losses = data.losses;
				}
			})
			.finally(function() {
				$scope.loadingRecord = false;
			});
	}
	
	$scope.hadForfeit = function(challenge) {
		return !challenge.challengerScore && !challenge.challengeeScore;
	};
	
	socket.on('player:change:username', function() {
		fetchChallenges();
	});
	socket.on('challenge:issued', function() {
		fetchChallenges();
	});
	socket.on('challenge:resolved', function() {
		fetchChallenges();
		getRecord();
	});
	socket.on('challenge:revoked', function() {
		fetchChallenges();
	});
	socket.on('challenge:forfeited', function() {
		fetchChallenges();
		getRecord();
	});

    init();

}
