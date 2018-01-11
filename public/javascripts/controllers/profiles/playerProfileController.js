angular
	.module('controllers')
	.controller('playerProfileController', PlayerProfileController);

PlayerProfileController.$inject = ['$scope', '$routeParams', 'jwtService', 'socket', 'playerService', 'playerChallengeService'];

function PlayerProfileController($scope, $routeParams, jwtService, socket, playerService, playerChallengeService) {
	
	$scope.profileId = null;
	$scope.challenges = {
		incoming: [],
		outgoing: [],
		resolved: []
	};
	
	$scope.loadingProfile = true;
	$scope.loadingChallenges = true;
	$scope.loadingRecord = true;

	function init() {
        $scope.profileId = $routeParams.id;
		if (!$scope.profileId) {
			console.log('No profile id detected.');
            $scope.profileId = jwtService.getDecodedToken().playerId;
		}
		
		loadPlayer();
		fetchChallenges();
		getRecord();
	}
	
	function loadPlayer() {
		playerService.getPlayer($scope.profileId).then(function(player) {
			if (!player) {
				console.log('Could not fetch profile');
				// TODO: Error message
				$scope.loadingProfile = false;
			} else {
				$scope.profile = player;
				$scope.loadingProfile = false;
			}
		});
	}
	
	function fetchChallenges() {
		playerChallengeService.getChallenges($scope.profileId).then( sortChallenges );
	}
	function sortChallenges(challenges) {
		$scope.challenges.resolved = challenges.resolved;
		$scope.challenges.outgoing = challenges.outgoing;
		$scope.challenges.incoming = challenges.incoming;
		$scope.loadingChallenges = false;
	}
	
	function getRecord() {
		playerService.getRecord($scope.profileId)
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
	
	socket.on('player:change:username', $scope, fetchChallenges);
	socket.on('challenge:issued', $scope, fetchChallenges);
	socket.on('challenge:resolved', $scope, function() {
		fetchChallenges() && getRecord();
    });
	socket.on('challenge:revoked', $scope, fetchChallenges);
	socket.on('challenge:forfeited', $scope, function() {
		fetchChallenges() && getRecord();
    });

    init();

}
