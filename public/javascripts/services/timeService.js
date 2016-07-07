angular.module('services')
.service('timeService', ['$filter', function($filter) {
	var ALLOWED_CHALLENGE_DAYS = 3;
	
	this.getAllowedChallengeDays = function() {
		return ALLOWED_CHALLENGE_DAYS;
	}
	
	this.parseDate = function (date) {
		// Is the date a mongoose date?
		if (date.includes('T'))
			return new Date($filter('mongoDate')(date));
		else
			return new Date($filter('date')(date));
	}
	
	this.timeBetween = function (date1, date2) {
		var neg = (date2 - date1) < 0;
		var diff =  Math.abs(date2 - date1);
		var seconds = Math.floor(diff/1000);
		var minutes = Math.floor(seconds/60); 
		seconds = seconds % 60;
		var hours = Math.floor(minutes/60);
		minutes = minutes % 60;
		return this.prettyTime(hours, minutes, seconds, neg);
	}
	
	this.prettyTime = function (hour, min, sec, neg=false) {
		neg = neg ? '-' : '';
		return neg + this.leftPad(hour, 2) + ':' + this.leftPad(min, 2) + ':' + this.leftPad(sec, 2);
	}
	
	this.leftPad = function (number, targetLength) {
		var output = number + '';
		while (output.length < targetLength) {
			output = '0' + output;
		}
		return output;
	}
	
	this.addBusinessDays = function (date, days) {
		// Bad Inputs
		if (!days || days == 0)
			return date;
		
		var d = new Date(date.getTime());
		var added = 0;
		while (added < days) {
			// Looks at tomorrow's day
			d.setDate(d.getDate()+1);
			if (this.isBusinessDay(d)) {
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
	this.isBusinessDay = function (date) {
		return date.getDay() != 0 && date.getDay() != 6;
	}
}]);
