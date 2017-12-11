angular.module('filters', []);
angular.module('services', []);
angular.module('directives', []);
angular.module('controllers', []);

angular.module('sparcPongApp', [
    'ngRoute',
    'ngCookies',
    'ui.bootstrap',
    'angular-jwt',
    'filters',
    'services',
    'directives',
    'controllers'
]);