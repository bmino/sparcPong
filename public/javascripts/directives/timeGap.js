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
            if (oDate) updateLater();

			function updateTime() {
				var elapsed;
				if (scope.type === 'since')
					elapsed = timeService.timeBetween(oDate, new Date());
				else if (scope.type === 'until')
					elapsed = timeService.timeBetween(new Date(), oDate);
				else {
					elapsed = "ERROR";
					console.log("You must specify a type of 'since' or 'until'");
				}
				elem.text(elapsed);
				angular.element(elem).addClass(dangerLevel(scope.date));
			}
			
			function updateLater() {
				updateTime();
				setTimeout(function() {
					updateLater();
				}, 1000);
			}

            function dangerLevel(gameTime) {
                var hours = timeService.hoursBetween(new Date(gameTime), new Date());
                if (hours <= 48)
                    return 'alert-success';
                if (hours > 48 && hours <= 72)
                    return 'alert-warning';
                if (hours > 72)
                    return 'alert-danger';
            }

		}
	}

}
