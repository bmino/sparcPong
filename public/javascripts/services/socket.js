angular.module('services')
.factory('socket', ['$rootScope', '$cookies', function($rootScope, $cookies) {
	var socket = io().connect();
	socket.on('reconnect', function() {
		// Log in upon reconnect
		var COOKIE_USER_KEY = 'sparcPongUser';
		var prevUserId = $cookies.getObject(COOKIE_USER_KEY);
		if (prevUserId) {
			socket.emit('login', prevUserId);
		}
	});
	
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		}
	};
}]);
