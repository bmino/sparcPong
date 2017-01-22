angular.module('controllers')
.controller('changeUsernameController', ['$scope', '$rootScope', 'modalService', 'playerService', function($scope, $rootScope, modalService, playerService) {
	
	$scope.newUsername = '';
	init();
	
	function init() {
		var playerId = $rootScope.myClient.playerId;
		if (playerId) {
			playerService.getPlayer(playerId)
				.then(applyUsernameChange)
				.catch(function(err) {
					console.log(err);
				});
		}
	}

	function applyUsernameChange(player) {
		if (player) $scope.newUsername = player.username;
	}
	
	$scope.validateUsername = function() {
		var playerId = $rootScope.myClient.playerId;
		var modalOptions;
		playerService.changeUsername(playerId, $scope.newUsername)
			.then(function(success) {
				modalOptions = {
					headerText: 'Change Username',
					bodyText: success
				};
				modalService.showAlertModal({}, modalOptions);
			})
			.catch(function(error) {
				modalOptions = {
					headerText: 'Change Username',
					bodyText: error
				};
				modalService.showAlertModal({}, modalOptions);
			});
	};

}]);
