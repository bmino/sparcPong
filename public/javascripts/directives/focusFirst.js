angular
	.module('directives')
	.directive('focusFirst', focusFirst);

focusFirst.$inject = ['$timeout'];

function focusFirst($timeout) {

	return {
		restrict: 'A',
		link : function($scope, $element) {
			$element[0].focus();
			$scope.$evalAsync();
		}
	}

}