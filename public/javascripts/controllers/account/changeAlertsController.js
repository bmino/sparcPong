angular.module('controllers')
.controller('changeAlertsController', ['$scope', '$rootScope', 'modalService', 'playerService', function($scope, $rootScope, modalService, playerService) {
	
	$scope.alerts = {
		challenged: { name: 'Challenged Alert', status: false },
		revoked: { name: 'Revoked Alert', status: false },
		resolved: { name: 'Resolved Alert', status: false },
		forfeited: { name: 'Forfeited Alert', status: false }
	};
	
	init();
	
	function init() {
		getAlerts();
	}
	
	function getAlerts() {
		var playerId = $rootScope.myClient.player._id;
		playerService.getAlerts(playerId).then(function(alerts) {
			for (var key in alerts) {
				$scope.alerts[key]['status'] = alerts[key];
			}
		});
	}
	
	function minifiedAlerts() {
		var minified = {};
		for (var key in $scope.alerts) {
			minified[key] = $scope.alerts[key]['status'];
		}
		return minified;
	}
	
	$scope.toggle = function(key) {
		$scope.alerts[key]['status'] = !$scope.alerts[key]['status'];
		updateAlerts();
	}
	
	function updateAlerts() {
		var playerId = $rootScope.myClient.player._id;
		playerService.updateAlerts(playerId, minifiedAlerts()).then(
			// Success
			function(success) {
				// Do nothing
				console.log(success);
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
