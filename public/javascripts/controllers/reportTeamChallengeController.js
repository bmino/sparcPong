angular
    .module('controllers')
    .controller('reportTeamChallengeController', ReportTeamChallengeController);

ReportTeamChallengeController.$inject = ['$scope', 'teamChallengeService', 'modalService'];

function ReportTeamChallengeController($scope, teamChallengeService, modalService) {

    $scope.resolve = function(challenge) {
        var modalOptions = {
            headerText: 'Resolve Challenge',
            challenge: challenge
        };
        modalService.showScoreModal({}, modalOptions)
            .then(function (result) {
                var challengerScore = result.challenge.challengerScore;
                var challengeeScore = result.challenge.challengeeScore;

                teamChallengeService.resolveChallenge(challenge._id, challengerScore, challengeeScore)
                    .then(function (success) {
                        modalOptions = {
                            headerText: 'Resolve Challenge',
                            bodyText: success
                        };
                        modalService.showAlertModal({}, modalOptions);
                    })
                    .catch(function (error) {
                        console.log(error);
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
                teamChallengeService.revokeChallenge(challenge._id)
                    .then(function (success) {
                        var modalOptions = {
                            headerText: 'Revoke Challenge',
                            bodyText: success
                        };
                        modalService.showAlertModal({}, modalOptions);
                    })
                    .catch(function (error) {
                        console.log(error);
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
                teamChallengeService.forfeitChallenge(challenge._id)
                    .then(function (success) {
                        modalOptions = {
                            headerText: 'Forfeit Challenge',
                            bodyText: success
                        };
                        modalService.showAlertModal({}, modalOptions);
                    })
                    .catch(function (error) {
                        console.log(error);
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
