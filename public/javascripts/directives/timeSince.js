angular.module('directives')
.directive('timeSince', ['$filter', '$interval', function($filter, $interval) {	
	return {
		restrict: 'E',
		scope: {
			date: '=',
		},
		link: function(scope, elem, attrs) {
			
			function updateTime(){
				var oDate = parseDate(scope.date);
				var elapsed = timeBetween(oDate, new Date());
				elem.text(elapsed);
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
			
		}
	}
}]);

