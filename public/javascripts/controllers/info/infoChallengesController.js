angular.module('controllers')
.controller('infoChallengesController', ['$rootScope', function($rootScope) {
	
	init();
	
	function init() {
		$rootScope.pageTitle = 'Challenges';
	}
	
}]);
