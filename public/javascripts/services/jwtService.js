angular
    .module('services')
    .service('jwtService', JwtService);

JwtService.$inject = ['$http', '$cookies', 'jwtHelper'];

function JwtService($http, $cookies, jwtHelper) {
    
    let service = this;

    let TOKEN_KEY = 'SPARC_PONG_AUTHORIZATION_TOKEN';

    service.getToken = function() {
        return $cookies.get(TOKEN_KEY);
    };

    service.setToken = function(token) {
        $cookies.put(TOKEN_KEY, token);
    };

    service.removeToken = function() {
        $cookies.remove(TOKEN_KEY);
    };

    service.getDecodedToken = function() {
        let token = $cookies.get(TOKEN_KEY);
        if (!token) return null;
        return jwtHelper.decodeToken(token);
    };

    service.clearHeaders = function() {
        $http.defaults.headers.common['Authorization'] = undefined;
        delete $http.defaults.headers.common['Authorization'];
    };

    service.setHeaders = function(token) {
        $http.defaults.headers.common['Authorization'] = 'JWT ' + token;
    };
}
