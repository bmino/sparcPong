angular.module('filters')
.filter('mongoDate', function($filter) {
	return function (incoming, filterString) {
		
		var formatDate = $filter('date');
		if (!incoming) return '';
		
		if (!filterString)
			filterString = 'M/d/yyyy h:mm a';

		return formatDate(new Date(incoming), filterString);
	}
});
