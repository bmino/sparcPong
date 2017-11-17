angular
    .module('sparcPongApp')
    .run(run);

run.$inject = ['$rootScope', '$location', 'loginService'];

function run($rootScope, $location, loginService) {

    // Routes here do not require a login
    var openRoutesRegex = /(\/login|\/signUp\/player|\/resetPassword\/*)/;

    // Keep user logged in after page refresh
    loginService.attemptRelogin();

    $rootScope.$on('$locationChangeStart', function(event, next, current) {
        var goingToOpenRoute = openRoutesRegex.test($location.path());
        if (!goingToOpenRoute && !loginService.isLoggedIn()) {
            console.log('Blocked route access to ' + $location.path());
            // Cannot access restricted route without logging in
            $location.path('/login');
        }
    });

}
