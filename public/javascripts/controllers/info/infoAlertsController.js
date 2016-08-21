angular.module('controllers')
.controller('infoAlertsController', ['$rootScope', function($rootScope) {
	
	init();
	
	function init() {
		$rootScope.pageTitle = 'Alerts';
	}
	
}]);
