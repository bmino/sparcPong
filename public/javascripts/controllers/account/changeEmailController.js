angular.module('controllers')
.controller('changeEmailController', ['$scope', '$rootScope', 'modalService', 'playerService', function($scope, $rootScope, modalService, playerService) {
	
	init();
	
	function init() {
		$rootScope.pageTitle = 'Change Email';
	}
	
	$scope.validateEmail = function() {
		var playerId = $rootScope.myClient.player._id;
		playerService.changeEmail(playerId, $scope.newEmail).then(
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
	}
	
	
	
	
}]);
