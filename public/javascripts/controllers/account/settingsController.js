angular.module('controllers')
.controller('settingsController', ['$scope', '$rootScope', 'modalService', 'playerService', function($scope, $rootScope, modalService, playerService) {
		
	init();
	
	function init() {
		$rootScope.pageTitle = 'Settings';
	}
	
}]);
