angular.module('sparcPongApp', [
	'ngRoute',
	'filters',
	'services',
	'controllers'
])


.config(function ($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: '/partials/login.html',
			controller: 'loginController'
		})
		.when('/login', {
			templateUrl: '/partials/login.html',
			controller: 'loginController'
		})
		.when('/board', {
			templateUrl: '/partials/board.html',
			controller: 'boardController'
		})
		.otherwise({
			redirectTo: '/'
		});

});