angular.module('directives')
.directive('timeGap', ['$interval', 'timeService', function($interval, timeService) {	
	return {
		restrict: 'E',
		scope: {
			date: '=',
			type: '@'
		},
		link: function(scope, elem, attrs) {
			
			var oDate = timeService.parseDate(scope.date);
			
			function updateTime() {
				if (scope.type == 'since')
					var elapsed = timeService.timeBetween(oDate, new Date());
				else if (scope.type == 'until')
					var elapsed = timeService.timeBetween(new Date(), oDate);
				else {
					var elapsed = "You must specify a type of 'since' or 'until'";
					console.log(elapsed);
				}
				elem.text(elapsed);
			}
			
			function updateLater() {
				updateTime();
				setTimeout(function() {
					updateLater();
				}, 1000);
			}
			
			updateLater();			
		}
	}
}]);

