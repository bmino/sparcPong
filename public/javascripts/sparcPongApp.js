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
		.when('/signUp', {
			templateUrl: '/partials/signUp.html',
			controller: 'signUpController'
		})
		.when('/info/challenges', {
			templateUrl: '/partials/info/challenges.html',
			controller: 'infoChallengesController'
		})
		.when('/info/rules', {
			templateUrl: '/partials/info/rules.html',
			controller: 'infoRulesController'
		})
		.otherwise({
			redirectTo: '/'
		});

});