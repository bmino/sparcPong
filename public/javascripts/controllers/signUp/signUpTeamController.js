angular
    .module('controllers')
    .controller('signUpTeamController', SignUpTeamController);

SignUpTeamController.$inject = ['$scope', 'modalService', 'playerService', 'teamService'];

function SignUpTeamController($scope, modalService, playerService, teamService) {

    $scope.players = [];

    $scope.team = {
        username: '',
        leader: null,
        partner: null
    };

    function init() {
        $scope.loadingPlayers = true;
        loadPlayers();
    }

    function loadPlayers() {
        $scope.loadingPlayers = true;
        playerService.getPlayers().then( function(players) {
            $scope.players = players;
            $scope.loadingPlayers = false;
        });
    }

    $scope.createTeam = function() {
        if (!$scope.team.leader || !$scope.team.partner) return;
        teamService.createTeam($scope.team.username, $scope.team.leader._id, $scope.team.partner._id)
            .then(creationSuccess, creationError);
    };

    function creationSuccess(response) {
        clearInputs();

        let modalOptions = {
            headerText: 'New Team',
            bodyText: response
        };
        modalService.showAlertModal({}, modalOptions);
    }

    function creationError(response) {
        let modalOptions = {
            headerText: 'New Team',
            bodyText: response
        };
        modalService.showAlertModal({}, modalOptions);
    }

    function clearInputs() {
        $scope.team = {
            username: '',
            leader: null,
            partner: null
        };
    }

    init();

}
