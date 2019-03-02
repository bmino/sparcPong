angular
	.module('directives')
	.directive('untilForfeit', untilForfeit);

untilForfeit.$inject = ['timeService'];


function untilForfeit(timeService) {

	return {
		restrict: 'E',
		scope: {
			date: '=',
			doubles: '@?'
		},
		link: function(scope, elem, attrs) {

			let initialDate, expireDate;

			let daysPromise = angular.isDefined(scope.doubles) ?
				timeService.getAllowedChallengeDaysTeam() :
				timeService.getAllowedChallengeDays();

            daysPromise.then(function(days) {
				initialDate = timeService.parseDate(scope.date);
				expireDate = timeService.addBusinessDays(initialDate, days);
				updateLater();
			});

			function updateLater() {
				updateTime();
				setTimeout(updateLater, 1000);
			}

            function updateTime() {
                let remaining = timeService.timeBetween(new Date(), expireDate);
                elem.text('[' + remaining + ']');
            }

		}
	}

}
