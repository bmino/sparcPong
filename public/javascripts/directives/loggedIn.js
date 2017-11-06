angular
	.module('directives')
	.directive('loggedIn', loggedIn);

loggedIn.$inject = ['loginService', 'jwtService'];

function loggedIn(loginService, jwtService) {

	return {
		link: function(scope, elem, attrs) {
            scope.$watch(loginService.isLoggedIn, function(isLogged) {
				if (!isLogged) return elem.hide();

				var checkIds = scope.$eval(attrs.loggedIn);

				// Any user will do
				if (!checkIds) return elem.show();

				// Requested a certain user
				if (inArray(jwtService.getDecodedToken().playerId, checkIds)) return elem.show();
				return elem.hide();
			});
		}
	};

	function inArray(needle, arr) {
		// This happens when a single parameter is passed in
		if (typeof arr === 'string') arr = [arr];
		return arr.indexOf(needle) !== -1;
	}

}
