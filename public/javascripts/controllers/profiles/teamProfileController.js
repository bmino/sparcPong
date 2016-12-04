angular.module('controllers')
.controller('teamProfileController', ['$scope', '$rootScope', '$routeParams', 'socket', 'modalService', 'teamService', 'teamChallengeService', function($scope, $rootScope, $routeParams, socket, modalService, teamService, teamChallengeService) {
	
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
		
		loadTeam();
		fetchChallenges();
		getRecord();
	}
	
	function loadTeam() {
		teamService.getTeam(profileId).then(function(team) {
			if (!team) {
				console.log('Could not fetch profile');
				$scope.loadingProfile = false;
			} else {
				$scope.profile = team;
				$scope.loadingProfile = false;
			}
		});
	}
	
	function fetchChallenges() {
		teamChallengeService.getChallenges(profileId).then( sortChallenges );
	}
	function sortChallenges(challenges) {
		$scope.challenges.resolved = challenges.resolved;
		$scope.challenges.outgoing = challenges.outgoing;
		$scope.challenges.incoming = challenges.incoming;
		$scope.loadingChallenges = false;
	}
	
	function getRecord() {
		teamService.getRecord(profileId).then(function(data) {
			if (data) {
				$scope.wins = data.wins;
				$scope.losses = data.losses;
			}
			$scope.loadingRecord = false;
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
			modalService.showTeamChallengeOptions({}, modalOptions).then(function(result) {
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
		var playerId = $rootScope.myClient.playerId;
		if (playerId != challenge.challengee.leader._id &&
			playerId != challenge.challengee.partner._id &&
			playerId != challenge.challenger.leader._id &&
			playerId != challenge.challenger.partner._id) {
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
			
			teamChallengeService.resolveChallenge(challenge._id, challengerScore, challengeeScore).then(
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
		var playerId = $rootScope.myClient.playerId;
		if (playerId != challenge.challenger.leader._id && playerId != challenge.challenger.partner._id) {
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
			teamChallengeService.revokeChallenge(challenge.challenger._id, challenge.challengee._id).then(
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
		var playerId = $rootScope.myClient.playerId;
		if (playerId != challenge.challengee.leader._id && playerId != challenge.challengee.partner._id) {
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
			teamChallengeService.forfeitChallenge(challenge._id).then(
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
