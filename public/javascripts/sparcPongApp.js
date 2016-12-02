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
		/* Board Routes */
		.when('/board/players', {
			templateUrl: '/partials/boards/player.html',
			controller: 'playerBoardController'
		})
		.when('/board/teams', {
			templateUrl: '/partials/boards/team.html',
			controller: 'teamBoardController'
		})
		
		/* Help Routes */
		.when('/help/challenges', {
			templateUrl: '/partials/help/challenges.html'
		})
		.when('/help/rules', {
			templateUrl: '/partials/help/rules.html'
		})
		.when('/help/alerts', {
			templateUrl: '/partials/help/alerts.html'
		})
		
		/* Player Routes */
		.when('/profile/player/:id', {
			templateUrl: '/partials/profiles/player.html',
			controller: 'playerProfileController'
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
		
		/* Team Routes */
		.when('/profile/team/:id', {
			templateUrl: '/partials/profiles/team.html',
			controller: 'teamProfileController'
		})
		
		/* Sign Up Routes */
		.when('/signUp/player', {
			templateUrl: '/partials/signUp/newPlayer.html',
			controller: 'signUpController'
		})
		.when('/signUp/team', {
			templateUrl: '/partials/signUp/newTeam.html',
			controller: 'signUpController'
		})
		
		.otherwise({
			redirectTo: '/board/players'
		});

});