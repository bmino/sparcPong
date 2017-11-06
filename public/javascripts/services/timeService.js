angular
	.module('services')
	.service('timeService', TimeService);

TimeService.$inject = ['$http', '$filter'];

function TimeService($http, $filter) {
	
	var service = this;
	
	service.getAllowedChallengeDays = function() {
        var request = $http({
            method: 'get',
            url: '/api/envBridge/ALLOWED_CHALLENGE_DAYS'
        });
        return request.then( handleSuccess, handleError );
	};

    service.getAllowedChallengeDaysTeam = function() {
        var request = $http({
            method: 'get',
            url: '/api/envBridge/ALLOWED_CHALLENGE_DAYS_TEAM'
        });
        return request.then( handleSuccess, handleError );
    };
	
	service.parseDate = function (date) {
		// Is the date a mongoose date?
		if (date.includes('T'))
			return new Date($filter('mongoDate')(date));
		else
			return new Date($filter('date')(date));
	};
	
	service.hoursBetween = function(date1, date2) {
		var diff =  Math.abs(date2 - date1);
		var seconds = Math.floor(diff/1000);
		var minutes = Math.floor(seconds/60);
		return Math.floor(minutes/60);
	};
	
	service.timeBetween = function (date1, date2) {
		var neg = (date2 - date1) < 0;
		var diff =  Math.abs(date2 - date1);
		var seconds = Math.floor(diff/1000);
		var minutes = Math.floor(seconds/60); 
		seconds = seconds % 60;
		var hours = Math.floor(minutes/60);
		minutes = minutes % 60;
		return service.prettyTime(hours, minutes, seconds, neg);
	};
	
	service.prettyTime = function (hour, min, sec, neg) {
		neg = neg ? '-' : '';
		return neg + service.leftPad(hour, 2) + ':' + service.leftPad(min, 2) + ':' + service.leftPad(sec, 2);
	};
	
	service.leftPad = function (number, targetLength) {
		var output = number + '';
		while (output.length < targetLength) {
			output = '0' + output;
		}
		return output;
	};
	
	service.addBusinessDays = function (date, days) {
		if (!days) return date;
		
		var dateClone = new Date(date.getTime());
		var added = 0;
		while (added < days) {
			// Looks at tomorrow's day
            dateClone.setDate(dateClone.getDate()+1);
			if (service.isBusinessDay(dateClone)) {
				added++;
			}
		}
		return dateClone;
	};

	service.isBusinessDay = function (date) {
		return date.getDay() !== 0 && date.getDay() !== 6;
	};


	function handleSuccess(response) {
		return response.data.days;
	}

	function handleError(response) {
        var dummy = document.createElement('body');
        dummy.innerHTML = response.data;
        throw dummy.getElementsByTagName("h1")[0].innerHTML;
	}

}
