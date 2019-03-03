angular
    .module('directives')
    .directive('reportPlayerChallenge', reportPlayerChallenge);

reportPlayerChallenge.$inject = [];

function reportPlayerChallenge() {

    return {
        templateUrl: 'partials/templates/report-player-challenge.html',
        scope: {
            challenge: '='
        },
        controller: 'reportPlayerChallengeController'
    };

}
