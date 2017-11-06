angular
	.module('controllers')
	.controller('headerController', HeaderController);

HeaderController.$inject = ['$scope', 'loginService', 'userBankService', 'socket'];

function HeaderController($scope, loginService, userBankService, socket) {

	/* Collapses the nav bar after a link is activated. */
	$('.navbar-collapse').on('click', function(e) {
		if( $(e.target).is('a') && $(e.target).attr('class') !== 'dropdown-toggle' ) {
			$(this).collapse('hide');
		}
	});

	socket.on('client:enter', function(clients) {
        userBankService.setUserCount(clients);
	});
	socket.on('client:leave', function(clients) {
        userBankService.setUserCount(clients);
	});
	socket.on('client:online', function(users) {
        userBankService.setLoggedInUsers(users);
	});
	socket.on('reconnect', loginService.attemptRelogin);

}