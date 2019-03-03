angular
    .module('directives')
    .directive('onlineUsersDisplay', onlineUsersDisplay);

onlineUsersDisplay.$inject = ['userBankService'];

function onlineUsersDisplay(userBankService) {

    return {
        template: "<div ng-bind-template='{{userCount()}} {{plural()}} currently online'></div>",
        link: function(scope, elem, attrs) {
            scope.userCount = function() {
                return userBankService.getUserCount();
            };
            scope.plural = function() {
                if (scope.userCount() === 1) return 'ponger';
                return 'pongers';
            };
        }
    };

}
