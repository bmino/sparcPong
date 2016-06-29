angular.module('filters')
.filter('mongoDate', function($filter) {
	return function (incoming, filterString) {
		
		var formatDate = $filter('date');

		if (!incoming) return '';
		
		var splitDate = incoming.split('T');
		var date = splitDate[0];
		var time = splitDate[1].split('.')[0];
		var dateTime = new Date(date + ' ' + time);
		
		if (!filterString)
			filterString = 'MM/dd/yyyy h:mm:ss a';

		return formatDate(dateTime, filterString);
	}
});

