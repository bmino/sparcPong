angular
    .module('controllers')
    .controller('reportPlayerChallengeController', ResolvePlayerChallengeController);

ResolvePlayerChallengeController.$inject = ['$scope', 'playerChallengeService', 'modalService'];

function ResolvePlayerChallengeController($scope, playerChallengeService, modalService) {

    $scope.resolve = function(challenge) {
        challenge.challengerScore = challenge.challengeeScore = 0;

        let modalOptions = {
            headerText: 'Resolve Challenge',
            bodyText: 'Report how many games each player won.',
            challenge: challenge
        };
        modalService.showScoreModal({}, modalOptions)
            .then(function (result) {
                let challengerScore = result.challenge.challengerScore;
                let challengeeScore = result.challenge.challengeeScore;

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
        let modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Revoke Challenge',
            headerText: 'Revoke',
            bodyText: 'Are you sure you wish to revoke this challenge?'
        };
        modalService.showModal({}, modalOptions)
            .then(() => {
                playerChallengeService.revokeChallenge(challenge._id)
                    .then(function (success) {
                        let modalOptions = {
                            headerText: 'Revoke Challenge',
                            bodyText: success
                        };
                        modalService.showAlertModal({}, modalOptions);
                    })
                    .catch(function (error) {
                        let modalOptions = {
                            headerText: 'Revoke Challenge',
                            bodyText: error
                        };
                        modalService.showAlertModal({}, modalOptions);
                    });
            })
            .catch(angular.noop);
    };

    $scope.forfeit = function(challenge) {
        let modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Forfeit Challenge',
            headerText: 'Forfeit',
            bodyText: 'Are you sure you wish to forfeit to ' + challenge.challenger.username + '?'
        };
        modalService.showModal({}, modalOptions)
            .then(() => {
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
