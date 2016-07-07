angular.module('sparcPongApp', [
	'ngRoute',
	'ui.bootstrap',
	'filters',
	'services',
	'directives',
	'controllers'
])


.config(function ($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: '/partials/board.html',
			controller: 'boardController'
		})
		.when('/profile/:playerId', {
			templateUrl: '/partials/profile.html',
			controller: 'profileController'
		})
		.when('/create/newPlayer', {
			templateUrl: '/partials/create/newPlayer.html',
			controller: 'newPlayerController'
		})
		.otherwise({
			redirectTo: '/'
		});

});