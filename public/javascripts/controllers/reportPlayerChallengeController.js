angular
    .module('controllers')
    .controller('reportPlayerChallengeController', ResolvePlayerChallengeController);

ResolvePlayerChallengeController.$inject = ['$scope', 'playerChallengeService', 'modalService'];

function ResolvePlayerChallengeController($scope, playerChallengeService, modalService) {

    $scope.resolve = function(challenge) {
        challenge.challengerScore = challenge.challengeeScore = 0;

        var modalOptions = {
            headerText: 'Resolve Challenge',
            bodyText: 'Report how many games each player won.',
            challenge: challenge
        };
        modalService.showScoreModal({}, modalOptions)
            .then(function (result) {
                var challengerScore = result.challenge.challengerScore;
                var challengeeScore = result.challenge.challengeeScore;

                playerChallengeService.resolveChallenge(challenge._id, challengerScore, challengeeScore)
                    .then(function (success) {
                        modalOptions = {
                            headerText: 'Resolve Challenge',
                            bodyText: success
                        };
                        modalService.showAlertModal({}, modalOptions);
                    })
                    .catch(function (error) {
                        modalOptions = {
                            headerText: 'Resolve Challenge',
                            bodyText: error
                        };
                        modalService.showAlertModal({}, modalOptions);
                    });
            })
            .catch(angular.noop);
    };

    $scope.revoke = function(challenge) {
        var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Revoke Challenge',
            headerText: 'Revoke',
            bodyText: 'Are you sure you wish to revoke this challenge?'
        };
        modalService.showModal({}, modalOptions)
            .then(function () {
                playerChallengeService.revokeChallenge(challenge._id)
                    .then(function (success) {
                        var modalOptions = {
                            headerText: 'Revoke Challenge',
                            bodyText: success
                        };
                        modalService.showAlertModal({}, modalOptions);
                    })
                    .catch(function (error) {
                        var modalOptions = {
                            headerText: 'Revoke Challenge',
                            bodyText: error
                        };
                        modalService.showAlertModal({}, modalOptions);
                    });
            })
            .catch(angular.noop);
    };

    $scope.forfeit = function(challenge) {
        var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Forfeit Challenge',
            headerText: 'Forfeit',
            bodyText: 'Are you sure you wish to forfeit to ' + challenge.challenger.username + '?'
        };
        modalService.showModal({}, modalOptions)
            .then(function () {
                playerChallengeService.forfeitChallenge(challenge._id)
                    .then(function (success) {
                        modalOptions = {
                            headerText: 'Forfeit Challenge',
                            bodyText: success
                        };
                        modalService.showAlertModal({}, modalOptions);
                    })
                    .catch(function (error) {
                        modalOptions = {
                            headerText: 'Forfeit Challenge',
                            bodyText: error
                        };
                        modalService.showAlertModal({}, modalOptions);
                    });
            })
            .catch(angular.noop);
    };
}
