angular.module('controllers')
.controller('headerController', ['$scope', '$rootScope', 'socket', 'playerService', function($scope, $rootScope, socket, playerService) {

	$scope.player;
	$scope.clients;
	
	init();
	
	function init() {
		$rootScope.myClient = {};
		populateUserList();
	}
	
	function populateUserList() {
		$scope.playerNames = playerService.getPlayers().then(function (players) {
			// Alphabetize and return
			$scope.players = players.sort(function(a,b) {
				return a.name.localeCompare(b.name);
			});
		});
	}
	
	$scope.selectUser = function(player) {
		$rootScope.myClient.player = player;
		console.log('Set root player to:');
		console.log($rootScope.myClient.player);
	}
	
	socket.on('player:new', function(player) {
		console.log('New user detected.');
		populateUserList();
	});
	socket.on('client:enter', function(clients) {
		console.log('Detected client entering.');
		$scope.clients = clients;
	});
	socket.on('client:leave', function(clients) {
		console.log('Detected client leaving.');
		$scope.clients = clients;
	});
	
}]);