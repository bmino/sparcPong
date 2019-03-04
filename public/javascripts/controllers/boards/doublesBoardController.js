angular
	.module('controllers')
	.controller('doublesBoardController', DoublesBoardController);

DoublesBoardController.$inject = ['$scope', 'jwtService', 'socket', 'modalService', 'timeService', 'teamService', 'teamChallengeService'];


function DoublesBoardController($scope, jwtService, socket, modalService, timeService, teamService, teamChallengeService) {

    $scope.teams = [];

    function init() {
        // TODO: implement a better solution than guessing big at 16 tiers
        generateTiers(16);
        populateTeams();
    }

    function generateTiers(tiers) {
        let arr = [];
        for (let t = 1; t < tiers; t++) {
            arr.push(t);
        }
        $scope.tiers = arr;
    }


    function populateTeams() {
        teamService.getTeams().then(function (teams) {
            sanitizeUsernames(teams);
            $scope.teams = teams;
        });
    }

    /* Should be covered by back end check, but just in case */
    function sanitizeUsernames(group) {
        for (let i = 0; i < group.length; i++) {
            group[i]['username'].replace(/&/g, '&amp;')
                .replace(/>/g, '&gt;')
                .replace(/</g, '&lt;')
                .replace(/"/g, '&quot;');
        }
    }

    $scope.dangerLevel = function (gameTime) {
        let hours = timeService.hoursBetween(new Date(gameTime), new Date());
        if (hours <= 48)
            return 'alert-success';
        if (hours > 48 && hours <= 72)
            return 'alert-warning';
        if (hours > 72)
            return 'alert-danger';
    };

    $scope.challengeTeam = function (challengeeId) {
        return teamChallengeService.createChallenge(challengeeId)
            .then(goodChallenge, badChallenge);
    };


    function goodChallenge(success) {
        let modalOptions = {
            headerText: 'Team Challenge',
            bodyText: success
        };
        modalService.showAlertModal({}, modalOptions);
    }

    function badChallenge(error) {
        let modalOptions = {
            headerText: 'Team Challenge',
            bodyText: error
        };
        modalService.showAlertModal({}, modalOptions);
    }

    socket.on('team:new', $scope, populateTeams);
    socket.on('team:change:username', $scope, populateTeams);
    socket.on('challenge:team:resolved', $scope, populateTeams);
    socket.on('challenge:team:forfeited', $scope, populateTeams);

    init();

}
