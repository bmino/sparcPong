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
		console.log('Fetching profile for ' + $scope.profileId);
		playerService.getPlayer($scope.profileId).then(function(player) {
			if (!player) {
				console.log('Could not fetch profile');
			} else {
				//console.log('Found profile');
				$rootScope.pageTitle = player.name;
				$scope.profile = player;
			}
		});
		fetchChallenges();
	}
	
	function fetchChallenges() {
		var playerId = $scope.profileId;
		console.log('Fetching challenges for ' + playerId);
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
				bodyText: 'You are logged in as '+ $rootScope.myClient.player.name +'. '+
						  'Only '+ challenge.challenger.name +' or '+ challenge.challengee.name +' can resolve this challenge.'
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
					socket.emit('challenge:resolved', challenge);
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
				bodyText: 'You are logged in as '+ $rootScope.myClient.player.name +'. '+
						  'Only '+ challenge.challenger.name +' can revoke this challenge.'
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
					socket.emit('challenge:revoked', challenge);
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
				bodyText: 'You are logged in as '+ $rootScope.myClient.player.name +'. '+
						  'Only '+ challenge.challengee.name +' can forfeit this challenge.'
			};
			modalService.showAlertModal({}, modalOptions);
			return;
		}
		
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Forfeit Challenge',
            headerText: 'Forfeit',
            bodyText: 'Are you sure you wish to forfeit to '+ challenge.challenger.name +'?'
        };
        modalService.showModal({}, modalOptions).then(function (okay) {
			if (!okay) return;
			challengeService.forfeitChallenge(challenge._id).then(
				function(success) {
					socket.emit('challenge:forfeited', challenge);
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
	
	socket.on('player:nameChange', function(player) {
		fetchChallenges();
	});
	socket.on('challenge:issued', function(challenge) {
		fetchChallenges();
	});
	socket.on('challenge:resolved', function(challenge) {
		fetchChallenges();
	});
	socket.on('challenge:revoked', function(challenge) {
		fetchChallenges();
	});
	socket.on('challenge:forfeited', function(challenge) {
		fetchChallenges();
	});
	
}]);
