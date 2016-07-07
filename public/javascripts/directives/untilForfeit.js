angular.module('directives')
.directive('untilForfeit', ['$interval', 'timeService', function($interval, timeService) {	
	return {
		restrict: 'E',
		scope: {
			date: '='
		},
		link: function(scope, elem, attrs) {
			
			var ALLOWED_CHALLENGE_DAYS = timeService.getAllowedChallengeDays();
			var oDate = timeService.parseDate(scope.date);
			var expireDate = timeService.addBusinessDays(oDate, ALLOWED_CHALLENGE_DAYS);
			
			function updateTime() {
				var remaining = timeService.timeBetween(new Date(), expireDate);
				elem.text(remaining);
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
