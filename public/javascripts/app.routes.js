angular
	.module('sparcPongApp')
	.config(routes);

routes.$inject = ['$routeProvider'];

function routes($routeProvider) {

	$routeProvider
		/* Board Routes */
		.when('/board/singles', {
			templateUrl: '/partials/boards/singles.html',
			controller: 'singlesBoardController'
		})
		.when('/board/doubles', {
			templateUrl: '/partials/boards/doubles.html',
			controller: 'doublesBoardController'
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
		.when('/profile/player/:id?', {
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
        .when('/account/changePassword', {
            templateUrl: '/partials/account/changePassword.html',
            controller: 'changePasswordController'
        })
		.when('/account/changeEmail', {
			templateUrl: '/partials/account/changeEmail.html',
			controller: 'changeEmailController'
		})
		
		/* Team Routes */
		.when('/profile/team/:id?', {
			templateUrl: '/partials/profiles/team.html',
			controller: 'teamProfileController'
		})
		
		/* Sign Up Routes */
		.when('/signUp/player', {
			templateUrl: '/partials/signUp/newPlayer.html',
			controller: 'signUpPlayerController'
		})
		.when('/signUp/team', {
			templateUrl: '/partials/signUp/newTeam.html',
			controller: 'signUpTeamController'
		})

		/* Authentication Routes */
		.when('/login', {
			templateUrl: '/partials/login.html',
			controller: 'loginController'
		})
        .when('/resetPassword/:resetKey?', {
            templateUrl: '/partials/resetPassword.html',
            controller: 'resetPasswordController'
        })
		
		.otherwise({
			redirectTo: '/board/singles'
		});

}