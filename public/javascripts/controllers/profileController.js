angular.module('controllers')
.controller('profileController', ['$scope', '$routeParams', 'socket', 'modalService', 'playerService', 'challengeService', function($scope, $routeParams, socket, modalService, playerService, challengeService) {
	
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
				console.log('Found profile');
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
	
	$scope.resolveChallenge = function(challenge) {		
		var modalOptions = {
			headerText: 'Resolve Challenge',
			challenge: challenge
		};
		modalService.showScoreModal({}, modalOptions).then(function(result) {
			if (!result)
				return;
			console.log('Resolving challenge');
			var challengerScore = result.challenge.challengerScore;
			var challengeeScore = result.challenge.challengeeScore;
			
			if (challengerScore && challengeeScore) {
				challengeService.resolveChallenge(challenge._id, challengerScore, challengeeScore).then(
					function(success) {
						console.log(success);
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
			} else {
				var modalOptions = {
					headerText: 'Resolve Challenge',
					bodyText: 'You must give valid scores for both players.'
				};
				modalService.showAlertModal({}, modalOptions);
			}
		});		
	};
	
	$scope.revokeChallenge = function(challenge) {
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Revoke Challenge',
            headerText: 'Revoke',
            bodyText: 'Are you sure you wish to revoke this challenge?'
        };
        modalService.showModal({}, modalOptions).then(function (okay) {
			if (!okay)
				return;
			console.log('Revoking challenge');
			challengeService.revokeChallenge(challenge.challenger._id, challenge.challengee._id).then(
				function(success) {
					console.log(success);
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
	$scope.forfeitChallenge = function(challenge) {
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Forfeit Challenge',
            headerText: 'Forfeit',
            bodyText: 'Are you sure you wish to forfeit to '+challenge.challengee.name +'?'
        };
        modalService.showModal({}, modalOptions).then(function (okay) {
			if (!okay)
				return;
			console.log('Forfeiting challenge');
			challengeService.forfeitChallenge(challenge._id).then(
				function(success) {
					console.log(success);
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
