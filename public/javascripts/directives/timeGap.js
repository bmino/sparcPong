angular
	.module('directives')
	.directive('timeGap', timeGap);

timeGap.$inject = ['timeService'];

function timeGap(timeService) {

	return {
		restrict: 'E',
		scope: {
			date: '=',
			type: '@'
		},
		link: function(scope, elem, attrs) {
			
			var oDate = scope.date ? timeService.parseDate(scope.date) : null;
			
			function updateTime() {
				var elapsed;
				if (scope.type == 'since')
					elapsed = timeService.timeBetween(oDate, new Date());
				else if (scope.type == 'until')
					elapsed = timeService.timeBetween(new Date(), oDate);
				else {
					elapsed = "ERROR";
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
			
			if (oDate) updateLater();
		}
	}

}
