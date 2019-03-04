angular
    .module('directives')
    .directive('rankedMatchDisplay', RankedMatchDisplay);

RankedMatchDisplay.$inject = [];

function RankedMatchDisplay() {

    return {
        scope: {
            challenge: '=',
            playerId: '=',
            type: '@'
        },
        template:
            '<span ng-bind="playerWon() ? \'Won vs\' : \'Lost vs\'"></span> ' +
            '<a ng-href="#!/profile/{{type}}/{{getOpponent()._id}}"><span ng-bind="getOpponent().username" ng-class="{strike: !getOpponent().active}"></span></a> ' +
            '<span ng-bind="getScore()"></span>' +
            '<br />' +
            '<span ng-bind="challenge.updatedAt | mongoDate"></span>',

        link: link
    };


    function link(scope, elem, attrs) {
        scope.getOpponent = function() {
            return scope.challenge.challenger._id === scope.playerId ? scope.challenge.challengee : scope.challenge.challenger;
        };

        scope.playerWon = function() {
            return getWinner()._id === scope.playerId;
        };

        scope.getScore = function() {
            if (hasForfeit()) return 'via forfeit';
            return '(' + getPlayerScore() + '-' + getOpponentScore() + ')';
        };


        function hasForfeit() {
            return scope.challenge.challengerScore === null;
        }

        function getWinner() {
            if (hasForfeit()) return scope.challenge.challenger;
            return scope.challenge.challengerScore > scope.challenge.challengeeScore ? scope.challenge.challenger : scope.challenge.challengee;
        }

        function getPlayerScore() {
            return scope.challenge.challenger._id === scope.playerId ? scope.challenge.challengerScore : scope.challenge.challengeeScore;
        }

        function getOpponentScore() {
            return scope.challenge.challengee._id === scope.playerId ? scope.challenge.challengerScore : scope.challenge.challengeeScore;
        }
    }

}
