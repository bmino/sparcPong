angular
	.module('directives')
	.directive('ifClientOnline', ifClientOnline);

ifClientOnline.$inject = ['loginService', 'jwtService'];

function ifClientOnline(loginService, jwtService) {

	return {
		link: link
	};

    function link(scope, elem, attrs) {
        scope.$watch(loginService.isLoggedIn, function(isLogged) {
            if (!isLogged) return elem.hide();

            var idsToCheck = scope.$eval(attrs.ifClientOnline);

            // Any user will do
            if (!idsToCheck) return elem.show();

            // Requested a certain user
            if (inArray(jwtService.getDecodedToken().playerId, idsToCheck)) return elem.show();
            return elem.hide();
        });
    }

	function inArray(needle, arr) {
		// This happens when a single parameter is passed in
		if (typeof arr === 'string') arr = [arr];
		return arr.indexOf(needle) !== -1;
	}

}
