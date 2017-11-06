angular
    .module('sparcPongApp')
    .run(run);

run.$inject = ['$rootScope', '$location', 'loginService'];

function run($rootScope, $location, loginService) {

    // Routes here do not require a login
    var openRoutes = ['/login', '/signUp/player'];

    // Keep user logged in after page refresh
    loginService.attemptRelogin();

    $rootScope.$on('$locationChangeStart', function(event, next, current) {
        var goingToOpenRoute = openRoutes.indexOf($location.path()) !== -1;
        if (!goingToOpenRoute && !loginService.isLoggedIn()) {
            console.log('Blocked route access to ' + $location.path());
            // Cannot access restricted route without logging in
            $location.path('/login');
        }
    });

}
