angular
	.module('controllers')
	.controller('headerController', HeaderController);

HeaderController.$inject = ['$scope', '$rootScope', '$location', '$cookies', 'socket', 'modalService', 'playerService'];

function HeaderController($scope, $rootScope, $location, $cookies, socket, modalService, playerService) {
	
	var COOKIE_USER_KEY = 'sparcPongUser';
	
	init();
	
	function init() {
		relogin();
		populateUserList();
	}

	function relogin() {
        // Look for previous user cookie
        var prevUserId = $cookies.getObject(COOKIE_USER_KEY);
        $rootScope.myClient = {};
        if (prevUserId) {
            socket.emit('login', prevUserId);
            $rootScope.myClient.playerId = prevUserId;
        }
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
			socket.emit('logout', $rootScope.myClient.playerId);
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
			modalService.showLogInModal({}, modalOptions)
				.then(function(player) {
					if (!player) return;
					addUserCookie(player._id);
					socket.emit('login', player._id);
					$rootScope.myClient.playerId = player._id;
					$location.path("/");
				})
				.catch(function() {});
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
	
	socket.on('player:new', function() {
		console.log(new Date().toLocaleTimeString() +' - New user detected.');
		populateUserList();
	});
    socket.on('team:new', function() {
        console.log(new Date().toLocaleTimeString() +' - New team detected.');
    });
    socket.on('player:change:username', function() {
		console.log(new Date().toLocaleTimeString() +' - Username change detected.');
		populateUserList();
	});
	socket.on('client:enter', function(clients) {
		$rootScope.clients = clients;
	});
	socket.on('client:leave', function(clients) {
		$rootScope.clients = clients;
	});
	socket.on('client:online', function(users) {
		$rootScope.onlineUsers = users;
	});
	socket.on('reconnect', function() {
		relogin();
	});
	
}