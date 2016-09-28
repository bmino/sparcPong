angular.module('controllers')
.controller('profileController', ['$scope', '$rootScope', '$routeParams', 'socket', 'modalService', 'playerService', 'challengeService', function($scope, $rootScope, $routeParams, socket, modalService, playerService, challengeService) {
	
	$scope.profileId;
	$scope.challenges = {
		incoming: [],
		outgoing: [],
		resolved: []
	};
	
	init();
	
	function init() {
		$scope.profileId = $routeParams.playerId;
		fetchChallenges();
		playerService.getPlayer($scope.profileId).then(function(player) {
			if (!player) {
				console.log('Could not fetch profile');
			} else {
				$scope.profile = player;
			}
		});
	}
	
	function fetchChallenges() {
		var playerId = $scope.profileId;
		challengeService.getChallengesIncoming(playerId).then( incomingChallenges );
		challengeService.getChallengesOutgoing(playerId).then( outgoingChallenges );
		challengeService.getChallengesResolved(playerId).then( resolvedChallenges );
	}
	function incomingChallenges(challenges) {
		$scope.challenges.incoming = challenges;
	}
	function outgoingChallenges(challenges) {
		$scope.challenges.outgoing = challenges;
	}
	function resolvedChallenges(challenges) {
		$scope.challenges.resolved = challenges;
	}
	
	$scope.expandChallenge = function(challenge) {
		var modalOptions = {
			challenge: challenge
		};
		modalService.showChallengeOptions({}, modalOptions).then(function(result) {
			if (!result) return;
			switch (result) {
				case 'resolve':
					resolveChallenge(challenge);
					break;
				case 'revoke':
					revokeChallenge(challenge);
					break;
				case 'forfeit':
					forfeitChallenge(challenge);
					break;
			}
		});
	};
	
	function resolveChallenge(challenge) {
		if ($rootScope.myClient.player._id != challenge.challengee._id && $rootScope.myClient.player._id != challenge.challenger._id) {
			var modalOptions = {
				headerText: 'Resolve Challenge',
				bodyText: 'You are logged in as '+ $rootScope.myClient.player.username +'. '+
						  'Only '+ challenge.challenger.username +' or '+ challenge.challengee.username +' can resolve this challenge.'
			};
			modalService.showAlertModal({}, modalOptions);
			return;
		}
		var modalOptions = {
			headerText: 'Resolve Challenge',
			challenge: challenge
		};
		modalService.showScoreModal({}, modalOptions).then(function(result) {
			if (!result) return;
			var challengerScore = result.challenge.challengerScore;
			var challengeeScore = result.challenge.challengeeScore;
			
			challengeService.resolveChallenge(challenge._id, challengerScore, challengeeScore).then(
				function(success) {
					var modalOptions = {
						headerText: 'Resolve Challenge',
						bodyText: success
					};
					modalService.showAlertModal({}, modalOptions);
				},
				function(error) {
					console.log(error);
					var modalOptions = {
						headerText: 'Resolve Challenge',
						bodyText: error
					};
					modalService.showAlertModal({}, modalOptions);
				}
			);
		});		
	};
	
	function revokeChallenge(challenge) {
		if (challenge.challenger._id != $rootScope.myClient.player._id) {
			var modalOptions = {
				headerText: 'Revoke Challenge',
				bodyText: 'You are logged in as '+ $rootScope.myClient.player.username +'. '+
						  'Only '+ challenge.challenger.username +' can revoke this challenge.'
			};
			modalService.showAlertModal({}, modalOptions);
			return;
		}
		
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Revoke Challenge',
            headerText: 'Revoke',
            bodyText: 'Are you sure you wish to revoke this challenge?'
        };
        modalService.showModal({}, modalOptions).then(function (okay) {
			if (!okay) return;
			challengeService.revokeChallenge(challenge.challenger._id, challenge.challengee._id).then(
				function(success) {
					var modalOptions = {
						headerText: 'Revoke Challenge',
						bodyText: success
					};
					modalService.showAlertModal({}, modalOptions);
				},
				function(error) {
					console.log(error);
					var modalOptions = {
						headerText: 'Revoke Challenge',
						bodyText: error
					};
					modalService.showAlertModal({}, modalOptions);
				}
			);
		});
	};
	function forfeitChallenge(challenge) {
		if (challenge.challengee._id != $rootScope.myClient.player._id) {
			var modalOptions = {
				headerText: 'Forfeit Challenge',
				bodyText: 'You are logged in as '+ $rootScope.myClient.player.username +'. '+
						  'Only '+ challenge.challengee.username +' can forfeit this challenge.'
			};
			modalService.showAlertModal({}, modalOptions);
			return;
		}
		
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Forfeit Challenge',
            headerText: 'Forfeit',
            bodyText: 'Are you sure you wish to forfeit to '+ challenge.challenger.username +'?'
        };
        modalService.showModal({}, modalOptions).then(function (okay) {
			if (!okay) return;
			challengeService.forfeitChallenge(challenge._id).then(
				function(success) {
					var modalOptions = {
						headerText: 'Forfeit Challenge',
						bodyText: success
					};
					modalService.showAlertModal({}, modalOptions);
				},
				function(error) {
					console.log(error);
					var modalOptions = {
						headerText: 'Forfeit Challenge',
						bodyText: error
					};
					modalService.showAlertModal({}, modalOptions);
				}
			);
        });
	};
	
	$scope.hadForfeit = function(challenge) {
		return !challenge.challengerScore && !challenge.challengeeScore;
	};
	
	socket.on('player:change:username', function(username) {
		fetchChallenges();
	});
	socket.on('challenge:issued', function() {
		fetchChallenges();
	});
	socket.on('challenge:resolved', function() {
		fetchChallenges();
	});
	socket.on('challenge:revoked', function() {
		fetchChallenges();
	});
	socket.on('challenge:forfeited', function() {
		fetchChallenges();
	});
	
}]);
