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
        var arr = [];
        for (var t = 1; t < tiers; t++) {
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
        for (var i = 0; i < group.length; i++) {
            group[i]['username'].replace(/&/g, '&amp;')
                .replace(/>/g, '&gt;')
                .replace(/</g, '&lt;')
                .replace(/"/g, '&quot;');
        }
    }

    $scope.dangerLevel = function (gameTime) {
        var hours = timeService.hoursBetween(new Date(gameTime), new Date());
        if (hours <= 48)
            return 'alert-success';
        if (hours > 48 && hours <= 72)
            return 'alert-warning';
        if (hours > 72)
            return 'alert-danger';
    };

    $scope.challengeTeam = function (challengeeId) {
        var challengerTeams = $scope.playerTeams();
        var modalOptions;

        if (challengerTeams.length === 0) {
            modalOptions = {
                headerText: 'Team Challenge',
                bodyText: 'You must join a team before issuing challenges.'
            };
            return modalService.showAlertModal({}, modalOptions);
        }

        if (challengerTeams.length === 1) {
            return teamChallengeService.createChallenge(challengerTeams[0]._id, challengeeId).then(goodChallenge, badChallenge);
        }

        // Which team are we challenging with?
        modalOptions = {
            headerText: 'Team Challenge',
            actionButtonText: 'Challenge',
            closeButtonText: 'Cancel',
            bodyText: 'Which team would you like to challenge with?',
            teams: challengerTeams
        };
        modalService.showSelectTeamModal({}, modalOptions).then(function (data) {
            if (!data || !data.challengeTeam) return;
            teamChallengeService.createChallenge(data.challengeTeam._id, challengeeId).then(goodChallenge, badChallenge);
        });
    };

    $scope.playerTeams = function() {
        var playerId = jwtService.getDecodedToken().playerId;
        if (!playerId) return [];
        var teams = [];
        $scope.teams.forEach(function (team) {
            if (team.leader === playerId || team.partner === playerId) teams.push(team);
        });
        return teams;
    };

    function goodChallenge(success) {
        var modalOptions = {
            headerText: 'Team Challenge',
            bodyText: success
        };
        modalService.showAlertModal({}, modalOptions);
    }

    function badChallenge(error) {
        console.log(error);
        var modalOptions = {
            headerText: 'Team Challenge',
            bodyText: error
        };
        modalService.showAlertModal({}, modalOptions);
    }

    socket.on('team:new', function () {
        populateTeams();
    });
    socket.on('team:change:username', function () {
        populateTeams();
    });
    socket.on('challenge:team:resolved', function () {
        populateTeams();
    });
    socket.on('challenge:team:forfeited', function () {
        populateTeams();
    });

    init();

}
