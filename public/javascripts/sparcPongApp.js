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
		.when('/edit/player/:playerId', {
			templateUrl: '/partials/edit/editPlayer.html',
			controller: 'editPlayerController'
		})
		.when('/new/newPlayer', {
			templateUrl: '/partials/new/newPlayer.html',
			controller: 'newPlayerController'
		})
		.when('/info/challenges', {
			templateUrl: '/partials/info/challenges.html'
			/* No controller */
		})
		.when('/info/rules', {
			templateUrl: '/partials/info/rules.html'
			/* No controller */
		})
		.otherwise({
			redirectTo: '/'
		});

});