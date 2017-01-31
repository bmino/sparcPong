angular.module('controllers')
.controller('doublesBoardController', ['$scope', '$rootScope', 'socket', 'modalService', 'timeService', 'teamService', 'teamChallengeService', function($scope, $rootScope, socket, modalService, timeService, teamService, teamChallengeService) {
	
	init();
	
	function init() {
		// TODO: implement a better solution than guessing big at 16 tiers
		generateTiers(16);
		populateTeams();
	}
	
	function generateTiers(tiers) {
		var arr = [];
		for (var t=1; t<tiers; t++) {
			arr.push(t);
		}
		$scope.tiers = arr;
	}

	
	function populateTeams() {
		teamService.getTeams().then( function(teams) {
			sanitizeUsernames(teams);
			$scope.teams = teams;
		});
	}
	
	/* Should be covered by back end check, but just in case */
	function sanitizeUsernames(group) {
		for (var i=0; i<group.length; i++) {
			group[i]['username'].replace(/&/g, '&amp;')
								.replace(/>/g, '&gt;')
								.replace(/</g, '&lt;')
								.replace(/"/g, '&quot;');
		}
	}
	
	$scope.dangerLevel = function(gameTime) {
		var hours = timeService.hoursBetween(new Date(gameTime), new Date());
		if (hours <= 48)
			return 'alert-success';
		if (hours > 48 && hours <= 72)
			return 'alert-warning';
		if (hours > 72)
			return 'alert-danger';
	};
	
	$scope.challengeTeam = function(challengeeId) {
		var challengerId = $rootScope.myClient.playerId;
		var challengerTeams = playerTeams(challengerId);
		var modalOptions;
		if (!challengerId || challengerTeams.length == 0) {
			modalOptions = {
				headerText: 'Team Challenge',
				bodyText: challengerId ? 'You are not a member of any team.' : 'You must log in before issuing challenges.'
			};
			modalService.showAlertModal({}, modalOptions);
			return;
		}
		
		if (challengerTeams.length > 1) {
			// More than 1 team... prompt for which one
			modalOptions = {
				headerText: 'Team Challenge',
				actionButtonText: 'Challenge',
				closeButtonText: 'Cancel',
				bodyText: 'Which team would you like to challenge with?',
				teams: challengerTeams
			};
			modalService.showSelectTeamModal({}, modalOptions).then( function(data) {
				if (!data || !data.challengeTeam) return;
				teamChallengeService.createChallenge(data.challengeTeam._id, challengeeId).then( goodChallenge, badChallenge );
			});
		} else {
			// Only a member of 1 team... create challenge
			teamChallengeService.createChallenge(challengerTeams[0]._id, challengeeId).then( goodChallenge, badChallenge );
		}
	};
	
	function playerTeams(playerId) {
		if (!playerId) return [];
		var teams = [];
		$scope.teams.forEach(function (team) {
			if (team.leader == playerId || team.partner == playerId) teams.push(team);
		});
		return teams;
	}
	
	function goodChallenge(success) {
		var modalOptions = {
            headerText: 'Challenge',
            bodyText: success
        };
        modalService.showAlertModal({}, modalOptions);
	}
	function badChallenge(error) {
		console.log(error);
		var modalOptions = {
            headerText: 'Challenge',
            bodyText: error
        };
        modalService.showAlertModal({}, modalOptions);
	}
	
	socket.on('team:new', function() {
		populateTeams();
	});
	socket.on('team:change:username', function() {
		populateTeams();
	});
	socket.on('challenge:team:resolved', function() {
		populateTeams();
	});
	socket.on('challenge:team:forfeited', function() {
		populateTeams();
	});
}]);
