angular
    .module('controllers')
    .controller('changePasswordController', ChangePasswordController);

ChangePasswordController.$inject = ['$scope', 'modalService', 'playerService'];

function ChangePasswordController($scope, modalService, playerService) {

    $scope.currentPassword = '';
    $scope.newPassword = '';
    $scope.newPasswordConfirm = '';

    function init() {

    }

    $scope.validatePassword = function() {
        let modalOptions;

        if ($scope.newPassword !== $scope.newPasswordConfirm) {
            modalOptions = {
                headerText: 'Change Password',
                bodyText: 'Password confirmation must match.'
            };
            modalService.showAlertModal({}, modalOptions);
            return;
        }

        playerService.changePassword($scope.currentPassword, $scope.newPassword)
            .then(function(success) {
                modalOptions = {
                    headerText: 'Change Password',
                    bodyText: success
                };
                modalService.showAlertModal({}, modalOptions);
            })
            .catch(function(error) {
                modalOptions = {
                    headerText: 'Change Password',
                    bodyText: error
                };
                modalService.showAlertModal({}, modalOptions);
            });
    };

    init();

}
