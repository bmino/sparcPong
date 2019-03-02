angular
    .module('sparcPongApp')
    .run(run);

run.$inject = ['$rootScope', '$location', 'loginService'];

function run($rootScope, $location, loginService) {

    // Keep user logged in after page refresh
    loginService.attemptRelogin();

    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        let destination = $location.path();

        if (!next.$$route) return;
        let goingToProtectedRoute = next.$$route.protected;

        if (goingToProtectedRoute && !loginService.isLoggedIn()) {
            console.log('Blocked route access to ' + destination);
            // Cannot access restricted route without logging in
            return $location.path('/login');
        }

    });

}
