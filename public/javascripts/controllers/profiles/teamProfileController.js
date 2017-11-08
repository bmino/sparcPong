angular
	.module('controllers')
	.controller('teamProfileController', TeamProfileController);

TeamProfileController.$inject = ['$scope', '$rootScope', '$routeParams', '$location', 'socket', 'modalService', 'jwtService', 'teamService', 'teamChallengeService'];

function TeamProfileController($scope, $rootScope, $routeParams, $location, socket, modalService, jwtService, teamService, teamChallengeService) {
	
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
		
		if (profileId) {
			loadTeam();
			fetchChallenges();
			getRecord();
		} else {
			console.log('Profile id not given. Looking up teams.');
			var clientId = jwtService.getDecodedToken().playerId;
			teamService.lookupTeams(clientId).then(function(teams) {
				if (!teams || teams.length === 0) {
					$location.path('signUp/team');
				} else {
					console.log('Found team [' + teams[0].username + ']');
					profileId = teams[0]._id;
					
					loadTeam();
					fetchChallenges();
					getRecord();
				}
			});
		}
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
	};
	
	function resolveChallenge(challenge) {
		var playerId = $rootScope.myClient.playerId;
		var modalOptions;
		if (playerId != challenge.challengee.leader._id &&
			playerId != challenge.challengee.partner._id &&
			playerId != challenge.challenger.leader._id &&
			playerId != challenge.challenger.partner._id) {
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
	}
	
	function revokeChallenge(challenge) {
		var playerId = $rootScope.myClient.playerId;
		var modalOptions;
		if (playerId != challenge.challenger.leader._id && playerId != challenge.challenger.partner._id) {
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
	}
	function forfeitChallenge(challenge) {
		var playerId = $rootScope.myClient.playerId;
		var modalOptions;
		if (playerId != challenge.challengee.leader._id && playerId != challenge.challengee.partner._id) {
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
	}
	
	$scope.hadForfeit = function(challenge) {
		return !challenge.challengerScore && !challenge.challengeeScore;
	};
	
	socket.on('player:change:username', function() {
		loadTeam();
	});
	socket.on('team:change:username', function() {
		loadTeam();
		fetchChallenges();
	});
	socket.on('challenge:team:issued', function() {
		fetchChallenges();
	});
	socket.on('challenge:team:resolved', function() {
		fetchChallenges();
		getRecord();
	});
	socket.on('challenge:team:revoked', function() {
		fetchChallenges();
	});
	socket.on('challenge:team:forfeited', function() {
		fetchChallenges();
		getRecord();
	});

    init();

}
