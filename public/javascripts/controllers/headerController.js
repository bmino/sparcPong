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
			// Sign Out
			$rootScope.myClient = {};
			modalOptions = {
				headerText: 'Sign Out',
				bodyText: 'Successfully signed out'
			};
			modalService.showAlertModal({}, modalOptions);
			
		} else {
			// Sign In
			modalOptions = {
				headerText: 'Sign In',
				closeButtonText: 'Cancel',
				actionButtonText: 'Sign In',
				players: $scope.players
			};
			modalService.showSignInModal({}, modalOptions).then(function(player) {
				if (!player)
					return;
				
				$rootScope.myClient.player = player;
				console.log('Signed in as:');
				console.log($rootScope.myClient.player);
				
				modalOptions = {
					headerText: 'Sign In',
					bodyText: 'Successfully signed in as '+$rootScope.myClient.player.name
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
		$scope.clients = clients;
	});
	socket.on('client:leave', function(clients) {
		console.log('Detected client leaving.');
		$scope.clients = clients;
	});
	
}]);