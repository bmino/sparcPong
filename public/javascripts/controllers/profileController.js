angular.module('controllers')
.controller('profileController', ['$scope', '$routeParams', 'playerService', 'challengeService', function($scope, $routeParams, playerService, challengeService) {
	
	$scope.challenges = {
		incoming: [],
		outgoing: [],
		resolved: []
	};
	
	init();
	
	function init() {
		var profileId = $routeParams.playerId;
		console.log('Fetching profile for ' + profileId);
		playerService.getPlayer(profileId).then( function(player) {
			if (!player) {
				console.log('Could fetch profile');
			} else {
				console.log('Found profile');
				$scope.profile = player;
			}
		});
		fetchChallenges(profileId);
	}
	
	function fetchChallenges(playerId) {
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
		challengeService.revokeChallenge(challenge.challenger._id, challenge.challengee._id).then( function(success) {}, function(error) {});
	}
	
}]);
