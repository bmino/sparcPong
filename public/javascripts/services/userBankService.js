angular
    .module('services')
    .service('userBankService', UserBankService);

UserBankService.$inject = [];

function UserBankService() {
    
    var service = this;

    service.USER_COUNT = 0;
    service.LOGGED_IN_USERS = [];


    service.getLoggedInUsers = function() {
        return service.LOGGED_IN_USERS;
    };

    service.setLoggedInUsers = function(users) {
        service.LOGGED_IN_USERS = users;
    };

    service.getUserCount = function() {
        return service.USER_COUNT;
    };

    service.setUserCount = function(userCount) {
        service.USER_COUNT = userCount;
    };

    service.isOnlineByPlayerId = function(playerId) {
        return service.LOGGED_IN_USERS.indexOf(playerId) !== -1;
    }

}
