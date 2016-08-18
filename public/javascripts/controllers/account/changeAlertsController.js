angular.module('controllers')
.controller('changeAlertsController', ['$scope', '$rootScope', 'modalService', 'playerService', function($scope, $rootScope, modalService, playerService) {
	
	$scope.alerts = {
		challenge: false
	};
	
	init();
	
	function init() {
		$rootScope.pageTitle = 'Change Alerts';
		getAlerts();
	}
	
	function getAlerts() {
		var playerId = $rootScope.myClient.player._id;
		playerService.getAlerts(playerId).then(function(alerts) {
			console.log(alerts);
			$scope.alerts.challenge = alerts.challenge;
		});
	}
	
	$scope.updateAlerts = function(playerId) {
		var playerId = $rootScope.myClient.player._id;
		playerService.updateAlerts(playerId, $scope.alerts).then(
			// Success
			function(success) {
				modalOptions = {
					headerText: 'Change Alerts',
					bodyText: success
				};
				modalService.showAlertModal({}, modalOptions);
			},
			// Error
			function(error) {
				modalOptions = {
					headerText: 'Change Alerts',
					bodyText: error
				};
				modalService.showAlertModal({}, modalOptions);
			}
		);
	};
}]);
