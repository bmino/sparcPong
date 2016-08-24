angular.module('directives')
.directive('untilForfeit', ['$interval', 'timeService', function($interval, timeService) {	
	return {
		restrict: 'E',
		scope: {
			date: '='
		},
		link: function(scope, elem, attrs) {
			
			var oDate;
			var expireDate;
			
			timeService.getAllowedChallengeDays().then(function(days) {
				oDate = timeService.parseDate(scope.date);
				expireDate = timeService.addBusinessDays(oDate, days);
				updateLater();
			});
			
			function updateTime() {
				var remaining = timeService.timeBetween(new Date(), expireDate);
				elem.text('[' + remaining + ']');
			}
			
			function updateLater() {
				updateTime();
				setTimeout(function() {
					updateLater();
				}, 1000);
			}
		}
	}
}]);
