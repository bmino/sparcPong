angular.module('directives')
.directive('timeGap', ['$interval', 'timeService', function($interval, timeService) {	
	return {
		restrict: 'E',
		scope: {
			date: '=',
			type: '@'
		},
		link: function(scope, elem, attrs) {
			
			var oDate = scope.date ? timeService.parseDate(scope.date) : null;
			
			function updateTime() {
				if (scope.type == 'since')
					var elapsed = timeService.timeBetween(oDate, new Date());
				else if (scope.type == 'until')
					var elapsed = timeService.timeBetween(new Date(), oDate);
				else {
					var elapsed = "ERROR";
					console.log("You must specify a type of 'since' or 'until'");
				}
				elem.text(elapsed);
			}
			
			function updateLater() {
				updateTime();
				setTimeout(function() {
					updateLater();
				}, 1000);
			}
			
			if (oDate)
				updateLater();			
		}
	}
}]);
