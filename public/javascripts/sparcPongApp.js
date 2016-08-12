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
		.when('/account/settings', {
			templateUrl: '/partials/account/settings.html',
			controller: 'settingsController'
		})
		.when('/account/changeName', {
			templateUrl: '/partials/account/changeName.html',
			controller: 'changeNameController'
		})
		.when('/info/challenges', {
			templateUrl: '/partials/info/challenges.html',
			controller: 'infoChallengesController'
		})
		.when('/info/rules', {
			templateUrl: '/partials/info/rules.html',
			controller: 'infoRulesController'
		})
		.when('/signUp', {
			templateUrl: '/partials/signUp.html',
			controller: 'signUpController'
		})
		.otherwise({
			redirectTo: '/'
		});

});