angular
	.module('controllers')
	.controller('changeUsernameController', ChangeUsernameController);

ChangeUsernameController.$inject = ['$scope', 'jwtService', 'modalService', 'playerService'];

function ChangeUsernameController($scope, jwtService, modalService, playerService) {
	
	$scope.newUsername = '';

	function init() {
		var playerId = jwtService.getDecodedToken().playerId;

		playerService.getPlayer(playerId)
			.then(populateUsernameField)
			.catch(console.log);
	}

	function populateUsernameField(player) {
		if (!player) console.log('Error fetching player.');
		else $scope.newUsername = player.username;
	}
	
	$scope.validateUsername = function() {
		var modalOptions;
		playerService.changeUsername($scope.newUsername)
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

    init();

}
