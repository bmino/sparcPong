angular
    .module('sparcPongApp')
    .config(routes);

routes.$inject = ['$routeProvider'];

function routes($routeProvider) {

    $routeProvider
    /* Board Routes */
        .when('/board/singles', {
            templateUrl: 'partials/boards/singles.html',
            controller: 'singlesBoardController',
            protected: true
        })
        .when('/board/doubles', {
            templateUrl: 'partials/boards/doubles.html',
            controller: 'doublesBoardController',
            protected: true
        })

        /* Help Routes */
        .when('/help/challenges', {
            templateUrl: 'partials/help/challenges.html',
            protected: true
        })
        .when('/help/rules', {
            templateUrl: 'partials/help/rules.html',
            protected: true
        })
        .when('/help/alerts', {
            templateUrl: 'partials/help/alerts.html',
            protected: true
        })

        /* Player Routes */
        .when('/profile/player/:id?', {
            templateUrl: 'partials/profiles/player.html',
            controller: 'playerProfileController',
            protected: true
        })
        .when('/account/changeAlerts', {
            templateUrl: 'partials/account/changeAlerts.html',
            controller: 'changeAlertsController',
            protected: true
        })
        .when('/account/changeUsername', {
            templateUrl: 'partials/account/changeUsername.html',
            controller: 'changeUsernameController',
            protected: true
        })
        .when('/account/changePassword', {
            templateUrl: 'partials/account/changePassword.html',
            controller: 'changePasswordController',
            protected: true
        })
        .when('/account/changeEmail', {
            templateUrl: 'partials/account/changeEmail.html',
            controller: 'changeEmailController',
            protected: true
        })

        /* Team Routes */
        .when('/profile/team/:id?', {
            templateUrl: 'partials/profiles/team.html',
            controller: 'teamProfileController',
            protected: true
        })

        /* Sign Up Routes */
        .when('/signUp/player', {
            templateUrl: 'partials/signUp/newPlayer.html',
            controller: 'signUpPlayerController',
            protected: false
        })
        .when('/signUp/team', {
            templateUrl: 'partials/signUp/newTeam.html',
            controller: 'signUpTeamController',
            protected: true
        })

        /* Authentication Routes */
        .when('/login', {
            templateUrl: 'partials/login.html',
            controller: 'loginController',
            protected: false
        })
        .when('/resetPassword/:resetKey?', {
            templateUrl: 'partials/resetPassword.html',
            controller: 'resetPasswordController',
            protected: false
        })

        .otherwise({
            redirectTo: '/board/singles'
        });

}