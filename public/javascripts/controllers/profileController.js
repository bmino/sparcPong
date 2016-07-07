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
		playerService.getPlayer($scope.profileId).then( function(player) {
			if (!player) {
				console.log('Could fetch profile');
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
		console.log(challenge);
		console.log();
		var challengerScore = window.prompt(challenge.challenger.name + " score:", 0);
		var challengeeScore = window.prompt(challenge.challengee.name + " score:", 0);
		
		if (challengerScore && challengeeScore) {
			challengeService.resolveChallenge(challenge._id, challengerScore, challengeeScore).then(
				function(success) {
					console.log(success);
					socket.emit('challenge:resolved', challenge);
				},
				function(error) {
					console.log(error);
					alert(error);
				}
			);
		} else {
			alert('You must give valid scores for both players');
		}
	}
	
	$scope.revokeChallenge = function(challenge) {
		console.log('Revoking challenge');
		challengeService.revokeChallenge(challenge.challenger._id, challenge.challengee._id).then(
			function(success) {
				console.log(success);
				alert(success);
				socket.emit('challenge:revoked', challenge);
			},
			function(error) {
				console.log(error);
				alert(error);
			}
		);
	}
	$scope.forfeitChallenge = function(challenge) {
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Forfeit',
            headerText: 'Forfeit to ' + challenge.challengee.name + '?',
            bodyText: 'Are you sure you wish to forfeit?'
        };

        modalService.showModal({}, modalOptions).then(function (result) {
            console.log(result);
        });
		
		var confirmed = confirm('Are you sure you wish to forfeit?');
		if (!confirmed)
			return;
		console.log('Forfeiting challenge');
		challengeService.forfeitChallenge(challenge._id).then(
			function(success) {
				console.log(success);
				alert(success);
				socket.emit('challenge:forfeited', challenge);
			},
			function(error) {
				console.log(error);
				alert(error);
			}
		);
	}
	
	
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
