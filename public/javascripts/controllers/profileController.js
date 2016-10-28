angular.module('controllers')
.controller('profileController', ['$scope', '$rootScope', '$routeParams', 'socket', 'modalService', 'playerService', 'challengeService', function($scope, $rootScope, $routeParams, socket, modalService, playerService, challengeService) {
	
	var profileId;
	$scope.challenges = {
		incoming: [],
		outgoing: [],
		resolved: []
	};
	
	var loadingProfile = true
	var loadingChallenges = true;
	var loadingRecord = true;
	
	init();
	
	function init() {
		profileId = $routeParams.playerId;
		if (!profileId) console.log('No profile id detected.');
		
		loadPlayer();
		fetchChallenges();
		getRecord();
	}
	
	$scope.loading = function() {
		return loadingProfile || loadingChallenges || loadingRecord;
	};
	
	function loadPlayer() {
		playerService.getPlayer(profileId).then(function(player) {
			if (!player) {
				console.log('Could not fetch profile');
				loadingProfile = false;
			} else {
				$scope.profile = player;
				loadingProfile = false;
			}
		});
	}
	
	function fetchChallenges() {
		challengeService.getChallenges(profileId).then( sortChallenges );
	}
	function sortChallenges(challenges) {
		$scope.challenges.resolved = challenges.resolved;
		$scope.challenges.outgoing = challenges.outgoing;
		$scope.challenges.incoming = challenges.incoming;
		loadingChallenges = false;
	}
	
	function getRecord() {
		playerService.getRecord(profileId).then(function(data) {
			if (data) {
				$scope.wins = data.wins;
				$scope.losses = data.losses;
			}
			loadingRecord = false;
		});
	}
	
	$scope.expandChallenge = function(challenge) {
		if (!$rootScope.myClient.playerId) {
			var modalOptions = {
				actionButtonText: 'OK',
				headerText: 'Report Challenge',
				bodyText: 'You must log in first.'
			};
			modalService.showAlertModal({}, modalOptions);
		} else {
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
		}		
	};
	
	function resolveChallenge(challenge) {
		if ($rootScope.myClient.playerId != challenge.challengee._id && $rootScope.myClient.playerId != challenge.challenger._id) {
			var modalOptions = {
				headerText: 'Resolve Challenge',
				bodyText: 'Only '+ challenge.challenger.username +' or '+ challenge.challengee.username +' can resolve this challenge.'
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
		if (challenge.challenger._id != $rootScope.myClient.playerId) {
			var modalOptions = {
				headerText: 'Revoke Challenge',
				bodyText: 'Only '+ challenge.challenger.username +' can revoke this challenge.'
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
		if (challenge.challengee._id != $rootScope.myClient.playerId) {
			var modalOptions = {
				headerText: 'Forfeit Challenge',
				bodyText: 'Only '+ challenge.challengee.username +' can forfeit this challenge.'
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
