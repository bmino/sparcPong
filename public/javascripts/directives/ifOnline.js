angular
	.module('directives')
	.directive('ifOnline', ifOnline);

ifOnline.$inject = ['userBankService'];

function ifOnline(userBankService) {

	return {
		link: link
	};

    function link(scope, elem, attrs) {

        scope.$watch(userBankService.getLoggedInUsers, function(onlineUserIds) {
            var idsToCheck = scope.$eval(attrs.ifOnline);

            if (!idsToCheck) return elem.hide();
            if (!onlineUserIds) return elem.hide();

            if (inArray(idsToCheck, onlineUserIds)) return elem.show();
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
