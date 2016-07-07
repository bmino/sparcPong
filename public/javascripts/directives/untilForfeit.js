angular.module('directives')
.directive('untilForfeit', ['$filter', '$interval', function($filter, $interval) {	
	return {
		restrict: 'E',
		scope: {
			date: '='
		},
		link: function(scope, elem, attrs) {
			
			var ALLOWED_CHALLENGE_DAYS = 3;
			var oDate = parseDate(scope.date);
			var expireDate = addBusinessDays(oDate, ALLOWED_CHALLENGE_DAYS);
			
			function updateTime() {
				/////console.log('timeBetween('+oDate+', '+expireDate+')');
				var remaining = timeBetween(new Date(), expireDate);
				elem.text(remaining);
			}
			
			function updateLater() {
				updateTime(); // update DOM
				setTimeout(function() {
					updateLater(); // schedule another update
				}, 1000);
			}
			
			updateLater();
			
			function parseDate(date) {
				// Is the date a mongoose date?
				if (date.includes('T'))
					return new Date($filter('mongoDate')(date));
				else
					return new Date($filter('date')(date));
			}
			
			function timeBetween(date1, date2) {
				var neg = (date2 - date1) < 0;
				var diff =  Math.abs(date2 - date1);
				var seconds = Math.floor(diff/1000);
				var minutes = Math.floor(seconds/60); 
				seconds = seconds % 60;
				var hours = Math.floor(minutes/60);
				minutes = minutes % 60;
				return prettyTime(hours, minutes, seconds, neg);
			}
			
			function prettyTime(hour, min, sec, neg=false) {
				neg = neg ? '-' : '';
				return neg + leftPad(hour, 2) + ':' + leftPad(min, 2) + ':' + leftPad(sec, 2);
			}
			
			function leftPad(number, targetLength) {
				var output = number + '';
				while (output.length < targetLength) {
					output = '0' + output;
				}
				return output;
			}
			
			function addBusinessDays(date, days) {
				// Bad Inputs
				if (!days || days == 0)
					return date;
				
				var d = new Date(date.getTime());
				var added = 0;
				while (added < days) {
					// Looks at tomorrow's day
					d.setDate(d.getDate()+1);
					if (isBusinessDay(d)) {
						added++;
					}
				}
				return d;
			}

			/*
			 * Determines if the given date is a business day.
			 *
			 * @param: date
			 */
			function isBusinessDay(date) {
				return date.getDay() != 0 && date.getDay() != 6;
			}
			
		}
	}
}]);
