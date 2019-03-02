angular
	.module('directives')
	.directive('ifOnline', ifOnline);

ifOnline.$inject = ['userBankService'];

function ifOnline(userBankService) {

	return {
		link: link,
        scope: {
		    ifOnline: '='
        }
	};

    function link(scope, elem, attrs) {

        scope.$watchGroup([userBankService.getLoggedInUsers, 'ifOnline'], function(watched) {
            let onlineUserIds = watched[0];

            if (!scope.ifOnline) return elem.hide();
            if (!onlineUserIds) return elem.hide();

            if (inArray(scope.ifOnline, onlineUserIds)) return elem.show();
            return elem.hide();
        });
    }

	function inArray(smallArray, bigArray) {
		// This happens when a single parameter is passed in
		if (typeof smallArray === 'string') smallArray = [smallArray];

		return smallArray.some(function (v) {
            return bigArray.indexOf(v) >= 0;
        });
	}

}
