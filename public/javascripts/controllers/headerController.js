angular.module('controllers')
.controller('headerController', ['$scope', '$rootScope', '$location', '$cookies', 'socket', 'modalService', 'playerService', function($scope, $rootScope, $location, $cookies, socket, modalService, playerService) {

	$scope.player;
	$scope.clients;
	
	var COOKIE_USER_KEY = 'sparcPongUser';
	
	init();
	
	function init() {
		// Look for previous user cookie
		var prevUserId = $cookies.getObject(COOKIE_USER_KEY);
		$rootScope.myClient = {};
		if (prevUserId) {
			$rootScope.myClient.playerId = prevUserId;
		}
		
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
		if ($rootScope.myClient.playerId) {
			// Log Out
			$cookies.remove(COOKIE_USER_KEY);
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
				addUserCookie(player._id);
				$rootScope.myClient.playerId = player._id;
				$location.path("/");
			});
		}
	};
	
	function addUserCookie(playerId) {
		var now = new Date();
		var year = now.getFullYear();
		var expires = new Date();
		expires.setFullYear(year + 1);
	
		var options = {
			expires: expires
		};
		$cookies.putObject(COOKIE_USER_KEY, playerId, options);
	}
	
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