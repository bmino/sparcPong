angular.module('sparcPongApp', [
	'ngRoute',
	'ngCookies',
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
		.when('/news', {
			templateUrl: '/partials/news.html',
			controller: 'newsController'
		})
		.when('/account/changeAlerts', {
			templateUrl: '/partials/account/changeAlerts.html',
			controller: 'changeAlertsController'
		})
		.when('/account/changeUsername', {
			templateUrl: '/partials/account/changeUsername.html',
			controller: 'changeUsernameController'
		})
		.when('/account/changeEmail', {
			templateUrl: '/partials/account/changeEmail.html',
			controller: 'changeEmailController'
		})
		.when('/help/challenges', {
			templateUrl: '/partials/help/challenges.html'
		})
		.when('/help/rules', {
			templateUrl: '/partials/help/rules.html'
		})
		.when('/help/alerts', {
			templateUrl: '/partials/help/alerts.html'
		})
		.when('/signUp', {
			templateUrl: '/partials/signUp.html',
			controller: 'signUpController'
		})
		.otherwise({
			redirectTo: '/'
		});

});