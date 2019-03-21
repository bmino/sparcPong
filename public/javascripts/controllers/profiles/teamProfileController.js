angular
    .module('controllers')
    .controller('teamProfileController', TeamProfileController);

TeamProfileController.$inject = ['$scope', '$routeParams', '$location', 'socket', 'jwtService', 'teamService', 'teamChallengeService'];

function TeamProfileController($scope, $routeParams, $location, socket, jwtService, teamService, teamChallengeService) {

    $scope.profileId = null;
    $scope.challenges = {
        incoming: [],
        outgoing: [],
        resolved: []
    };

    $scope.loadingProfile = true;
    $scope.loadingChallenges = true;
    $scope.loadingRecord = true;

    function init() {
        $scope.profileId = $routeParams.id;

        if ($scope.profileId) {
            loadTeam();
            fetchChallenges();
            getRecord();
        } else {
            console.log('Profile id not given. Looking up teams.');
            let clientId = jwtService.getDecodedToken().playerId;
            teamService.lookupTeamByPlayerId(clientId)
                .then(function(team) {
                    if (!team) {
                        $location.path('signUp/team');
                    } else {
                        console.log('Found team [' + team.username + ']');
                        $scope.profileId = team._id;
                        loadTeam();
                        fetchChallenges();
                        getRecord();
                    }
                });
        }
    }

    function loadTeam() {
        return teamService.getTeam($scope.profileId)
            .then(function(team) {
                if (!team) {
                    console.log('Could not fetch profile');
                    // TODO: Error message
                    $scope.loadingProfile = false;
                } else {
                    $scope.profile = team;
                    $scope.loadingProfile = false;
                }
            });
    }

    function fetchChallenges() {
        return teamChallengeService.getChallenges($scope.profileId)
            .then( sortChallenges );
    }

    function sortChallenges(challenges) {
        $scope.challenges.resolved = challenges.resolved;
        $scope.challenges.outgoing = challenges.outgoing;
        $scope.challenges.incoming = challenges.incoming;
        $scope.loadingChallenges = false;
    }

    function getRecord() {
        return teamChallengeService.getRecord($scope.profileId)
            .then(function(data) {
                if (data) {
                    $scope.wins = data.wins;
                    $scope.losses = data.losses;
                }
            })
            .finally(function() {
                $scope.loadingRecord = false;
            });
    }


    socket.on('player:change:username', $scope, function() {
        loadTeam().then(fetchChallenges);
    });
    socket.on('team:change:username', $scope, function() {
        loadTeam().then(fetchChallenges);
    });
    socket.on('challenge:team:resolved', $scope, function() {
        fetchChallenges().then(getRecord);
    });
    socket.on('challenge:team:forfeited', $scope, function() {
        fetchChallenges().then(getRecord);
    });
    socket.on('challenge:team:issued', $scope, fetchChallenges);
    socket.on('challenge:team:revoked', $scope, fetchChallenges);

    init();

}
