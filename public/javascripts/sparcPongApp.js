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
		.when('/account/changeAlerts', {
			templateUrl: '/partials/account/changeAlerts.html',
			controller: 'changeAlertsController'
		})
		.when('/account/changeName', {
			templateUrl: '/partials/account/changeName.html',
			controller: 'changeNameController'
		})
		.when('/account/changeEmail', {
			templateUrl: '/partials/account/changeEmail.html',
			controller: 'changeEmailController'
		})
		.when('/info/challenges', {
			templateUrl: '/partials/info/challenges.html'
		})
		.when('/info/rules', {
			templateUrl: '/partials/info/rules.html'
		})
		.when('/info/alerts', {
			templateUrl: '/partials/info/alerts.html'
		})
		.when('/signUp', {
			templateUrl: '/partials/signUp.html',
			controller: 'signUpController'
		})
		.otherwise({
			redirectTo: '/'
		});

});