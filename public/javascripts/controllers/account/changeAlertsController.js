angular
	.module('controllers')
	.controller('changeAlertsController', changeAlertsController);

changeAlertsController.$inject = ['$scope', 'modalService', 'playerService'];

function changeAlertsController($scope, modalService, playerService) {

    $scope.alerts = {
        challenged: {name: 'Challenged Alert', status: false},
        revoked: {name: 'Revoked Alert', status: false},
        resolved: {name: 'Resolved Alert', status: false},
        forfeited: {name: 'Forfeited Alert', status: false},
        team: {
            challenged: {name: 'Challenged Alert', status: false},
            revoked: {name: 'Revoked Alert', status: false},
            resolved: {name: 'Resolved Alert', status: false},
            forfeited: {name: 'Forfeited Alert', status: false}
        }
    };

    function init() {
        getAlerts();
    }

    function getAlerts() {
        playerService.getAlerts()
            .then(function (alerts) {
                angular.forEach(alerts, function (alert, alertKey) {
                    if (alertKey === 'team') {
                        angular.forEach(alerts.team, function (team, teamKey) {
                            $scope.alerts['team'][teamKey]['status'] = alerts['team'][teamKey];
                        });
                    } else {
                        $scope.alerts[alertKey]['status'] = alerts[alertKey];
                    }
                });
            })
            .catch(angular.noop);
    }

    function minifiedAlerts() {
        let minified = {
            team: {}
        };
        angular.forEach($scope.alerts, function (value, alertKey) {
            if (alertKey === 'team') {
                angular.forEach($scope.alerts.team, function (value, teamKey) {
                    minified['team'][teamKey] = $scope.alerts['team'][teamKey]['status'];
                });
            } else {
                minified[alertKey] = $scope.alerts[alertKey]['status'];
            }
        });
        return minified;
    }

    $scope.toggle = function (key, path) {
        if (path) {
            $scope.alerts[path][key]['status'] = !$scope.alerts[path][key]['status'];
        } else {
            $scope.alerts[key]['status'] = !$scope.alerts[key]['status'];
        }
        updateAlerts();
    };

    function updateAlerts() {
        playerService.updateAlerts(minifiedAlerts())
            .catch(function (error) {
                let modalOptions = {
                    headerText: 'Change Alerts',
                    bodyText: error
                };
                modalService.showAlertModal({}, modalOptions);
            });
    }

    init();

}
