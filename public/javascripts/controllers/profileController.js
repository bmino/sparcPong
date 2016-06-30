angular.module('controllers')
.controller('profileController', ['$scope', '$routeParams', 'playerService', 'challengeService', function($scope, $routeParams, playerService, challengeService) {
	
	$scope.profileId;
	$scope.challenges = {
		incoming: [],
		outgoing: [],
		resolved: []
	};
	
	init();
	
	function init() {
		$scope.profileId = $routeParams.playerId;
		console.log('Fetching profile for ' + $scope.profileId);
		playerService.getPlayer($scope.profileId).then( function(player) {
			if (!player) {
				console.log('Could fetch profile');
			} else {
				console.log('Found profile');
				$scope.profile = player;
			}
		});
		fetchChallenges();
	}
	
	function fetchChallenges() {
		var playerId = $scope.profileId;
		console.log('Fetching challenges');
		challengeService.getChallengesIncoming(playerId).then( incomingChallenges );
		challengeService.getChallengesOutgoing(playerId).then( outgoingChallenges );
		challengeService.getChallengesResolved(playerId).then( resolvedChallenges );
	}
	function incomingChallenges(challenges) {
		console.log('Found incoming challenges');
		$scope.challenges.incoming = challenges;
	}
	function outgoingChallenges(challenges) {
		console.log('Found outgoing challenges');
		$scope.challenges.outgoing = challenges;
	}
	function resolvedChallenges(challenges) {
		console.log('Found resolved challenges');
		$scope.challenges.resolved = challenges;
	}
	
	$scope.resolveChallenge = function(challenge) {
		// TODO: get score information
		challengeService.resolveChallenge(challenge.challenger._id, challenge.challengee._id, challengerScore, challengeeScore).then( function(success) {}, function(error) {});
	}
	
	$scope.revokeChallenge = function(challenge) {
		console.log(challenge.challenger._id);
		challengeService.revokeChallenge(challenge.challenger._id, challenge.challengee._id).then(
			function(success) {
				console.log(success);
				alert(success);
				fetchChallenges();
			},
			function(error) {
				console.log(error);
				alert(error);
			}
		);
	}
	
}]);
