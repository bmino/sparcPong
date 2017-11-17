angular
	.module('directives')
	.directive('ifClientOnline', ifClientOnline);

ifClientOnline.$inject = ['loginService', 'jwtService'];

function ifClientOnline(loginService, jwtService) {

	return {
		link: link,
        scope: {
		    ifClientOnline: '='
        }
	};

    function link(scope, elem, attrs) {
        scope.$watchGroup([loginService.isLoggedIn, 'ifClientOnline'], function(watched) {
            var isLogged = watched[0];
            var idsToCheck = scope.ifClientOnline;

            // Nobody is logged in
            if (!isLogged) return elem.hide();

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
