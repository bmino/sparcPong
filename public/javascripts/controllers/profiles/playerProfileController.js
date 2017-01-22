angular.module('controllers')
.controller('playerProfileController', ['$scope', '$rootScope', '$routeParams', 'socket', 'modalService', 'playerService', 'playerChallengeService', function($scope, $rootScope, $routeParams, socket, modalService, playerService, playerChallengeService) {
	
	var profileId;
	$scope.challenges = {
		incoming: [],
		outgoing: [],
		resolved: []
	};
	
	$scope.loadingProfile = true
	$scope.loadingChallenges = true;
	$scope.loadingRecord = true;
	
	init();
	
	function init() {
		profileId = $routeParams.id;
		if (!profileId) {
			console.log('No profile id detected.');
			return;
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
	
	$scope.expandChallenge = function(challenge) {
		var modalOptions;
		if (!$rootScope.myClient.playerId) {
			modalOptions = {
				actionButtonText: 'OK',
				headerText: 'Report Challenge',
				bodyText: 'You must log in first.'
			};
			modalService.showAlertModal({}, modalOptions);
		} else {
			modalOptions = {
				challenge: challenge
			};
			modalService.showPlayerChallengeOptions({}, modalOptions)
				.then(function(result) {
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
				})
				.catch(function() {});
		}		
	};
	
	function resolveChallenge(challenge) {
		var modalOptions;
		if ($rootScope.myClient.playerId != challenge.challengee._id && $rootScope.myClient.playerId != challenge.challenger._id) {
			modalOptions = {
				headerText: 'Resolve Challenge',
				bodyText: 'Only '+ challenge.challenger.username +' or '+ challenge.challengee.username +' can resolve this challenge.'
			};
			modalService.showAlertModal({}, modalOptions);
			return;
		}
		modalOptions = {
			headerText: 'Resolve Challenge',
			challenge: challenge
		};
		modalService.showScoreModal({}, modalOptions)
			.then(function(result) {
				var challengerScore = result.challenge.challengerScore;
				var challengeeScore = result.challenge.challengeeScore;

				playerChallengeService.resolveChallenge(challenge._id, challengerScore, challengeeScore)
					.then(function(success) {
						modalOptions = {
							headerText: 'Resolve Challenge',
							bodyText: success
						};
						modalService.showAlertModal({}, modalOptions);
					})
					.catch(function(error) {
						console.log(error);
						modalOptions = {
							headerText: 'Resolve Challenge',
							bodyText: error
						};
						modalService.showAlertModal({}, modalOptions);
					});
			})
			.catch(function() {});
	}
	
	function revokeChallenge(challenge) {
		var modalOptions;
		if (challenge.challenger._id != $rootScope.myClient.playerId) {
			modalOptions = {
				headerText: 'Revoke Challenge',
				bodyText: 'Only '+ challenge.challenger.username +' can revoke this challenge.'
			};
			modalService.showAlertModal({}, modalOptions);
			return;
		}
		
		modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Revoke Challenge',
            headerText: 'Revoke',
            bodyText: 'Are you sure you wish to revoke this challenge?'
        };
        modalService.showModal({}, modalOptions)
			.then(function () {
				playerChallengeService.revokeChallenge(challenge.challenger._id, challenge.challengee._id)
					.then(function(success) {
						var modalOptions = {
							headerText: 'Revoke Challenge',
							bodyText: success
						};
						modalService.showAlertModal({}, modalOptions);
					})
					.catch(function(error) {
						console.log(error);
						var modalOptions = {
							headerText: 'Revoke Challenge',
							bodyText: error
						};
						modalService.showAlertModal({}, modalOptions);
					});
			})
			.catch(function() {});
	}

	function forfeitChallenge(challenge) {
		var modalOptions;
		if (challenge.challengee._id != $rootScope.myClient.playerId) {
			modalOptions = {
				headerText: 'Forfeit Challenge',
				bodyText: 'Only '+ challenge.challengee.username +' can forfeit this challenge.'
			};
			modalService.showAlertModal({}, modalOptions);
			return;
		}
		
		modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Forfeit Challenge',
            headerText: 'Forfeit',
            bodyText: 'Are you sure you wish to forfeit to '+ challenge.challenger.username +'?'
        };
        modalService.showModal({}, modalOptions)
			.then(function() {
				playerChallengeService.forfeitChallenge(challenge._id)
					.then(function(success) {
						modalOptions = {
							headerText: 'Forfeit Challenge',
							bodyText: success
						};
						modalService.showAlertModal({}, modalOptions);
					})
					.catch(function(error) {
						console.log(error);
						modalOptions = {
							headerText: 'Forfeit Challenge',
							bodyText: error
						};
						modalService.showAlertModal({}, modalOptions);
					});
			})
			.catch(function() {});
	}
	
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
		getRecord();
	});
	socket.on('challenge:revoked', function() {
		fetchChallenges();
	});
	socket.on('challenge:forfeited', function() {
		fetchChallenges();
		getRecord();
	});
	
}]);
