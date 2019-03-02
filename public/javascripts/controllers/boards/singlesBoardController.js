angular
	.module('controllers')
	.controller('singlesBoardController', SinglesBoardController);

SinglesBoardController.$inject = ['$scope', 'socket', 'modalService', 'playerService', 'playerChallengeService'];

function SinglesBoardController($scope, socket, modalService, playerService, playerChallengeService) {
	
	function init() {
		// TODO: implement a better solution than guessing big at 16 tiers
		generateTiers(16);
		populatePlayers();
	}
	
	function generateTiers(tiers) {
		let arr = [];
		for (let t=1; t<tiers; t++) {
			arr.push(t);
		}
		$scope.tiers = arr;
	}
	
	function populatePlayers() {
		playerService.getPlayers().then( function(players) {
			sanitizeUsernames(players);
			$scope.players = players;
		});
	}
	
	/* Should be covered by back end check, but just in case */
	function sanitizeUsernames(group) {
		for (let i=0; i<group.length; i++) {
			group[i]['username'].replace(/&/g, '&amp;')
								.replace(/>/g, '&gt;')
								.replace(/</g, '&lt;')
								.replace(/"/g, '&quot;');
		}
	}
	
	$scope.challenge = function(challengeeId) {
		playerChallengeService.createChallenge(challengeeId).then( goodChallenge, badChallenge );
	};
	function goodChallenge(success) {
		let modalOptions = {
            headerText: 'Challenge',
            bodyText: success
        };
        modalService.showAlertModal({}, modalOptions);
	}
	function badChallenge(error) {
		let modalOptions = {
            headerText: 'Challenge',
            bodyText: error
        };
        modalService.showAlertModal({}, modalOptions);
	}
	
	socket.on('player:new', $scope, populatePlayers);
	socket.on('player:change:username', $scope, populatePlayers);
	socket.on('challenge:resolved', $scope, populatePlayers);
	socket.on('challenge:forfeited', $scope, populatePlayers);

    init();

}
