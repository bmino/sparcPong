angular.module('controllers')
.controller('headerController', ['$scope', '$rootScope', '$location', 'socket', 'modalService', 'playerService', function($scope, $rootScope, $location, socket, modalService, playerService) {

	$scope.player;
	$scope.clients;
	
	init();
	
	function init() {
		$rootScope.myClient = {};
		populateUserList();
	}
	
	function populateUserList() {
		playerService.getPlayers().then(function (players) {
			// Alphabetize and return
			$scope.players = players.sort(function(a,b) {
				return a.username.localeCompare(b.username);
			});
		});
	}
	
	$scope.changeUser = function() {
		var modalOptions;
		if ($rootScope.myClient.player) {
			// Log Out
			$rootScope.myClient = {};
			$location.path("/");
			modalOptions = {
				headerText: 'Log Out',
				bodyText: 'Successfully logged out'
			};
			modalService.showAlertModal({}, modalOptions);
			
		} else {
			// Log In
			modalOptions = {
				headerText: 'Log In',
				closeButtonText: 'Cancel',
				actionButtonText: 'Log In',
				players: $scope.players
			};
			modalService.showLogInModal({}, modalOptions).then(function(player) {
				if (!player) return;
				$rootScope.myClient.player = player;
				$location.path("/");
			});
		}
	};
	
	/* Collapses the nav bar after a link is activated. */
	$('.navbar-collapse').on('click', function(e) {
		if( $(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle' ) {
			$(this).collapse('hide');
		}
	});
	
	socket.on('player:new', function(username) {
		console.log(new Date().toLocaleTimeString() +' - New user detected.');
		populateUserList();
	});
	socket.on('player:change:username', function(username) {
		populateUserList();
	});
	socket.on('client:enter', function(clients) {
		console.log(new Date().toLocaleTimeString() +' - Detected client entering.');
		$rootScope.clients = clients;
	});
	socket.on('client:leave', function(clients) {
		console.log(new Date().toLocaleTimeString() +' - Detected client leaving.');
		$rootScope.clients = clients;
	});
	
}]);