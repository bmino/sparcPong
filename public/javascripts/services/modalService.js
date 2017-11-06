angular
	.module('services')
	.service('modalService', ModalService);

ModalService.$inject = ['$uibModal'];

function ModalService($uibModal) {
	
	var service = this;

	var modalDefaults = {
		backdrop: true,
		keyboard: true,
		modalFade: true,
		templateUrl: '/partials/modals/base.html'
	};

	var modalOptions = {
		closeButtonText: 'Close',
		actionButtonText: 'OK',
		headerText: 'Proceed?',
		bodyText: 'Perform this action?'
	};


	service.showSelectTeamModal = function(customModalDefaults, customModalOptions) {
		customModalDefaults.templateUrl = '/partials/modals/selectTeam.html';
		return service.showModal(customModalDefaults, customModalOptions);
	};
	
	service.showAlertModal = function(customModalDefaults, customModalOptions) {
		customModalDefaults.templateUrl = '/partials/modals/alert.html';
		customModalOptions.actionButtonText = 'OK';
		return service.showModal(customModalDefaults, customModalOptions);
	};
	
	service.showScoreModal = function(customModalDefaults, customModalOptions) {
		customModalDefaults.templateUrl = '/partials/modals/score.html';
		return service.showModal(customModalDefaults, customModalOptions);
	};
	
	service.showModal = function (customModalDefaults, customModalOptions) {
		if (!customModalDefaults) customModalDefaults = {};
		customModalDefaults.backdrop = 'static';
		return service.show(customModalDefaults, customModalOptions);
	};
	

	service.show = function (customModalDefaults, customModalOptions) {
		
		var tempModalDefaults = {};
		var tempModalOptions = {};

		// Map angular-ui modal custom defaults to modal defaults defined in service
		angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

		// Map base.html $scope custom properties to defaults defined in service
		angular.extend(tempModalOptions, modalOptions, customModalOptions);

		if (!tempModalDefaults.controller) {
			tempModalDefaults.controller = ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
				$scope.modalOptions = tempModalOptions;
				$scope.modalOptions.ok = function (result) {
					$uibModalInstance.close(result);
				};
				$scope.modalOptions.close = function (result) {
					$uibModalInstance.dismiss('cancel');
				};
			}]
		}

		return $uibModal.open(tempModalDefaults).result;
	};

}