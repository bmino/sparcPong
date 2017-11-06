angular
	.module('directives')
	.directive('reportTeamChallenge', reportTeamChallenge);

reportTeamChallenge.$inject = [];

function reportTeamChallenge() {

	return {
		templateUrl: '/partials/templates/report-team-challenge.html',
		scope: {
			challenge: '='
		},
		controller: 'reportTeamChallengeController'
	};

}
