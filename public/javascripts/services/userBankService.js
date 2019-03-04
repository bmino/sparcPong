angular
    .module('services')
    .service('userBankService', UserBankService);

UserBankService.$inject = [];

function UserBankService() {
    
    let service = this;

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

    service.isOnlineByPlayerIds = function() {
        let found = false;
        angular.forEach(arguments, function(pid) {
            if (service.LOGGED_IN_USERS.indexOf(pid) >= 0) return found = true;
        });
        return found;
    };

}
