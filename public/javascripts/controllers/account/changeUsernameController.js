angular.module('controllers')
.controller('changeUsernameController', ['$scope', '$rootScope', 'modalService', 'playerService', function($scope, $rootScope, modalService, playerService) {
	
	$scope.newUsername = '';
	init();
	
	function init() {
		var playerId = $rootScope.myClient.playerId;
		if (playerId) {
			playerService.getPlayer(playerId).then(function (player) {
				if (player) {
					$scope.newUsername = player.username;
				}
			});
		}
	}
	
	$scope.validateUsername = function() {
		var playerId = $rootScope.myClient.playerId;
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
