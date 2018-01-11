angular
	.module('controllers')
	.controller('teamProfileController', TeamProfileController);

TeamProfileController.$inject = ['$scope', '$routeParams', '$location', 'socket', 'jwtService', 'teamService', 'teamChallengeService'];

function TeamProfileController($scope, $routeParams, $location, socket, jwtService, teamService, teamChallengeService) {
	
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
		
		if ($scope.profileId) {
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
                    $scope.profileId = teams[0]._id;
					
					loadTeam();
					fetchChallenges();
					getRecord();
				}
			});
		}
	}
	
	function loadTeam() {
		teamService.getTeam($scope.profileId).then(function(team) {
			if (!team) {
				console.log('Could not fetch profile');
				// TODO: Error message
				$scope.loadingProfile = false;
			} else {
				$scope.profile = team;
				$scope.loadingProfile = false;
			}
		});
	}
	
	function fetchChallenges() {
		teamChallengeService.getChallenges($scope.profileId).then( sortChallenges );
	}
	function sortChallenges(challenges) {
		$scope.challenges.resolved = challenges.resolved;
		$scope.challenges.outgoing = challenges.outgoing;
		$scope.challenges.incoming = challenges.incoming;
		$scope.loadingChallenges = false;
	}
	
	function getRecord() {
		teamService.getRecord($scope.profileId).then(function(data) {
			if (data) {
				$scope.wins = data.wins;
				$scope.losses = data.losses;
			}
			$scope.loadingRecord = false;
		});
	}

	
	socket.on('player:change:username', $scope, loadTeam);
	socket.on('team:change:username', $scope, function() {
		loadTeam() && fetchChallenges();
    });
	socket.on('challenge:team:issued', $scope, fetchChallenges);
	socket.on('challenge:team:resolved', $scope, function() {
		fetchChallenges() && getRecord();
    });
	socket.on('challenge:team:revoked', $scope, fetchChallenges);
	socket.on('challenge:team:forfeited', $scope, function() {
		fetchChallenges() && getRecord();
    });

    init();

}
