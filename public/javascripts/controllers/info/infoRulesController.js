angular.module('controllers')
.controller('infoRulesController', ['$rootScope', function($rootScope) {
	
	init();
	
	function init() {
		$rootScope.pageTitle = 'Game Rules';
	}
	
}]);
