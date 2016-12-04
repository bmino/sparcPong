angular.module('controllers')
.controller('doublesBoardController', ['$scope', '$rootScope', 'socket', 'modalService', 'timeService', 'teamChallengeService', function($scope, $rootScope, socket, modalService, timeService, teamChallengeService) {
	
	init();
	
	function init() {
		// TODO: implement a better solution than guessing big at 12 tiers
		generateTiers(12);
		//populateTeams();
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
	
	$scope.challengeTeam = function(teamId) {
		var playerId = $rootScope.myClient.playerId;
		if (!playerId) {
			var modalOptions = {
				actionButtonText: 'OK',
				headerText: 'Challenge',
				bodyText: 'You must log in first.'
			};
			modalService.showAlertModal({}, modalOptions);
		} else {
			// TODO: New team challenge
			teamChallengeService.XXXXXX(playerId, challengeeId).then( goodChallenge, badChallenge );
		}
	};
	
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
	
	socket.on('team:new', function(username) {
		populateTeams();
	});
	socket.on('team:change:username', function(username) {
		populateTeams();
	});
	socket.on('challenge:resolved', function() {
		populateTeams();
	});
	socket.on('challenge:forfeited', function() {
		populateTeams();
	});
}]);
