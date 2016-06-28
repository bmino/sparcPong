angular.module('sparcPongApp', [
	'ngRoute',
	'filters',
	'services',
	'controllers'
])


.config(function ($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: '/partials/board.html',
			controller: 'boardController'
		})
		.when('/login', {
			templateUrl: '/partials/login.html',
			controller: 'loginController'
		})
		.when('/create/newPlayer', {
			templateUrl: '/partials/create/newPlayer.html',
			controller: 'newPlayerController'
		})
		.otherwise({
			redirectTo: '/'
		});

});