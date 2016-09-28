angular.module('controllers')
.controller('changeUsernameController', ['$scope', '$rootScope', 'modalService', 'playerService', function($scope, $rootScope, modalService, playerService) {
	
	init();
	
	function init() {
		$scope.newUsername = $rootScope.myClient.player.username || '';
	}
	
	$scope.validateUsername = function() {
		var playerId = $rootScope.myClient.player._id;
		playerService.changeUsername(playerId, $scope.newUsername).then(
			// Success
			function(success) {
				modalOptions = {
					headerText: 'Change Username',
					bodyText: success
				};
				modalService.showAlertModal({}, modalOptions);
			},
			// Error
			function(error) {
				modalOptions = {
					headerText: 'Change Username',
					bodyText: error
				};
				modalService.showAlertModal({}, modalOptions);
			}
		);
	}
}]);
