angular
    .module('controllers')
    .controller('changeEmailController', ChangeEmailController);

ChangeEmailController.$inject = ['$scope', 'jwtService', 'modalService', 'playerService'];


function ChangeEmailController($scope, jwtService, modalService, playerService) {

    $scope.email = '';

    function init() {
        getEmail();
    }

    function getEmail() {
        let playerId = jwtService.getDecodedToken().playerId;

        playerService.getPlayer(playerId).then(function(player) {
            if (!player) console.log('Uh oh, this player could not be found.');
            else $scope.email = player.email;
        });
    }

    $scope.validateEmail = function() {
        let modalOptions;
        playerService.changeEmail($scope.email).then(
            // Success
            function(success) {
                modalOptions = {
                    headerText: 'Change Email',
                    bodyText: success
                };
                modalService.showAlertModal({}, modalOptions);
            },
            // Error
            function(error) {
                modalOptions = {
                    headerText: 'Change Email',
                    bodyText: error
                };
                modalService.showAlertModal({}, modalOptions);
            }
        );
    };

    $scope.removeEmail = function() {
        let modalOptions;
        playerService.removeEmail().then(
            // Success
            function(success) {
                getEmail();
                modalOptions = {
                    headerText: 'Remove Email',
                    bodyText: success
                };
                modalService.showAlertModal({}, modalOptions);
            },
            // Error
            function(error) {
                modalOptions = {
                    headerText: 'Remove Email',
                    bodyText: error
                };
                modalService.showAlertModal({}, modalOptions);
            }
        );
    };

    init();

}
