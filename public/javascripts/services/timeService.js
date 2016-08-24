angular.module('services')
.service('timeService', ['$filter', '$q', function($filter, $q) {
	
	this.getAllowedChallengeDays = function() {
		var deferral = $q.defer();
		$.get('/api/envBridge/ALLOWED_CHALLENGE_DAYS').then(function(data) {
			deferral.resolve(data.days);
		});
		return deferral.promise;
	}
	
	this.parseDate = function (date) {
		// Is the date a mongoose date?
		if (date.includes('T'))
			return new Date($filter('mongoDate')(date));
		else
			return new Date($filter('date')(date));
	}
	
	this.hoursBetween = function(date1, date2) {
		var diff =  Math.abs(date2 - date1);
		var seconds = Math.floor(diff/1000);
		var minutes = Math.floor(seconds/60);
		var hours = Math.floor(minutes/60);
		return hours;
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
