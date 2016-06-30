angular.module('directives')
.directive('loggedIn', ['$rootScope', function($rootScope) {	
	return {
		link: function(scope, elem, attrs) {
			$rootScope.$watch('myClient.player', function(player) {
				if (player)
					elem.show();
				else
					elem.hide();
			});
		}
	}
}]);
