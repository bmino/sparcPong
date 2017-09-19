angular.module('filters', []);
angular.module('services', []);
angular.module('directives', []);
angular.module('controllers', []);

angular.module('sparcPongApp', [
    'ngRoute',
    'ngCookies',
    'ui.bootstrap',
    'filters',
    'services',
    'directives',
    'controllers'
]);