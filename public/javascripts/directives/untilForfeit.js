angular.module('directives')
.directive('untilForfeit', ['$interval', 'timeService', function($interval, timeService) {	
	return {
		restrict: 'E',
		scope: {
			date: '=',
			doubles: '@?'
		},
		link: function(scope, elem, attrs) {
			
			var oDate, expireDate, getDaysMethod;

			if (angular.isDefined(scope.doubles))
				getDaysMethod = timeService.getAllowedChallengeDaysTeam;
			else
				getDaysMethod = timeService.getAllowedChallengeDays;

            getDaysMethod().then(function(days) {
				oDate = timeService.parseDate(scope.date);
				expireDate = timeService.addBusinessDays(oDate, days);
				updateLater();
			});
			
			function updateLater() {
				updateTime();
				setTimeout(function() {
					updateLater();
				}, 1000);
			}

            function updateTime() {
                var remaining = timeService.timeBetween(new Date(), expireDate);
                elem.text('[' + remaining + ']');
            }

		}
	}
}]);
