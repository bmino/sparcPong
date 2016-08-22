angular.module('controllers')
.controller('changeEmailController', ['$scope', '$rootScope', 'modalService', 'playerService', function($scope, $rootScope, modalService, playerService) {
	
	$scope.email = '';
	
	init();
	
	function init() {
		$rootScope.pageTitle = 'Change Email';
		getEmail();
	}
	
	function getEmail() {
		var playerId = $rootScope.myClient.player._id;
		playerService.getPlayer(playerId).then(function(player) {
			if (!player) console.log('Uh oh, this player could not be found.');
			else $scope.email = player.email;
		});
	}
	
	$scope.validateEmail = function() {
		var playerId = $rootScope.myClient.player._id;
		playerService.changeEmail(playerId, $scope.email).then(
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
