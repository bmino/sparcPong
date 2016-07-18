angular.module('controllers')
.controller('headerController', ['$scope', '$rootScope', 'socket', 'modalService', 'playerService', function($scope, $rootScope, socket, modalService, playerService) {

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
				return a.name.localeCompare(b.name);
			});
		});
	}
	
	$scope.changeUser = function() {
		var modalOptions;
		if ($rootScope.myClient.player) {
			// Log Out
			$rootScope.myClient = {};
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
				if (!player)
					return;
				
				$rootScope.myClient.player = player;
				console.log('Logged in as:');
				console.log($rootScope.myClient.player);
				
				modalOptions = {
					headerText: 'Log In',
					bodyText: 'Successfully logged in as '+$rootScope.myClient.player.name
				};
				modalService.showAlertModal({}, modalOptions);
			});
		}
	};
	
	/* Collapses the nav bar after a link is activated. */
	$('.navbar-collapse').on('click', function(e) {
		if( $(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle' ) {
			$(this).collapse('hide');
		}
	});
	
	socket.on('player:new', function(player) {
		console.log('New user detected.');
		populateUserList();
	});
	socket.on('player:nameChange', function(player) {
		console.log('Name change detected.');
		populateUserList();
	});
	socket.on('client:enter', function(clients) {
		console.log('Detected client entering.');
		$rootScope.clients = clients;
	});
	socket.on('client:leave', function(clients) {
		console.log('Detected client leaving.');
		$rootScope.clients = clients;
	});
	
}]);