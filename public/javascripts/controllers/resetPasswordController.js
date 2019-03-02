angular
	.module('controllers')
	.controller('resetPasswordController', ResetPasswordController);

ResetPasswordController.$inject = ['$scope', '$routeParams', '$location', 'modalService', 'loginService'];

function ResetPasswordController($scope, $routeParams, $location, modalService, loginService) {

    $scope.resetKey = '';
	$scope.newPassword = '';
	$scope.newPasswordConfirm = '';

	function init() {
		$scope.resetKey = $routeParams.resetKey;
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

		loginService.changePasswordWithResetKey($scope.newPassword, $scope.resetKey)
			.then(function(success) {
				modalOptions = {
					headerText: 'Reset Password',
					bodyText: success
				};
				modalService.showAlertModal({}, modalOptions);
				clearInputs();
			})
			.catch(function(error) {
				modalOptions = {
					headerText: 'Reset Password',
					bodyText: error
				};
				modalService.showAlertModal({}, modalOptions);
			});
	};

	$scope.goToLogin = function() {
		$location.path('/login');
	};

	function clearInputs() {
        $scope.resetKey = '';
        $scope.newPassword = '';
        $scope.newPasswordConfirm = '';
	}

    init();

}
