const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TeamChallenge = mongoose.model('TeamChallenge');
const Team = mongoose.model('Team');
const MailerService = require('../../services/MailerService');
const ChallengeService = require('../../services/ChallengeService');
const TeamChallengeService = require('../../services/TeamChallengeService');
const AuthService = require('../../services/AuthService');

/**
 * Issue new challenge.
 * @param: challengerId
 * @param: challengeeId
 */
router.post('/', function(req, res, next) {
	let challengeeId = req.body.challengeeId;
    let clientId = AuthService.verifyToken(req.token).playerId;

	// Grabs team info on both challenge participants
	let challengerTeamsPromise = Team.getTeamsByPlayerId(clientId);
	let challengeeTeamPromise =	Team.findById(challengeeId).exec();

	Promise.all([challengerTeamsPromise, challengeeTeamPromise])
		.then(function(results) {
			let playerTeams = results[0];
			let challengeeTeam = results[1];
			if (!playerTeams || playerTeams.length === 0) return Promise.reject(new Error('Player must be a member of a team.'));
			return TeamChallengeService.verifyAllowedToChallenge([playerTeams[0], challengeeTeam]);
		})
		.then(function(teams) {
            if (!teams[0].hasMemberByPlayerId(clientId)) {
                return Promise.reject(new Error(`You must be a member of the challenging team, "${teams[0].username}"`));
            }
            return TeamChallenge.createByTeams(teams);
        })
		.then(function(challenge) {
            MailerService.newTeamChallenge(challenge._id);
            req.app.io.sockets.emit('challenge:team:issued');
            res.json({message: 'Challenge issued!'});
		})
		.catch(next);
});


/**
 * Get all challenges involving a team.
 * @param: teamId
 */
router.get('/:teamId', function(req, res, next) {
	let teamId = req.params.teamId;

	if (!teamId) return next(new Error('This is not a valid team.'));

	let resolvedChallenges = TeamChallenge.getResolved(teamId)
		.then(TeamChallenge.populateTeams);

	let outgoingChallenges = TeamChallenge.getOutgoing(teamId)
		.then(TeamChallenge.populateTeamsAndTeamMembers);

	let incomingChallenges = TeamChallenge.getIncoming(teamId)
		.then(TeamChallenge.populateTeamsAndTeamMembers);

	Promise.all([resolvedChallenges, outgoingChallenges, incomingChallenges])
		.then(function(challenges) {
            res.json({message: {resolved: challenges[0], outgoing: challenges[1], incoming: challenges[2]}});
		})
		.catch(next);

});


/**
 * Revoke wrongly issued challenge.
 * @param: challengeId
 */
router.delete('/revoke', function(req, res, next) {
	let challengeId = req.body.challengeId;
    let clientId = AuthService.verifyToken(req.token).playerId;
	
	if (!challengeId) return next(new Error('This is not a valid challenge id.'));

	TeamChallenge.findById(challengeId).exec()
		.then(function(challenge) {
            if (!challenge) return Promise.reject(new Error('Could not find the challenge.'));
            return TeamChallengeService.verifyAllowedToRevoke(challenge, clientId);
        })
		.then(TeamChallenge.removeByDocument)
		.then(function(challenge) {
            MailerService.revokedTeamChallenge(challenge.challenger, challenge.challengee);
            req.app.io.sockets.emit('challenge:team:revoked');
            res.json({message: 'Successfully revoked challenge.'});
		})
		.catch(next);
});

/**
 * Resolve challenge by adding a score and winner.
 * @param: challengeId
 * @param: challengerScore
 * @param: challengeeScore
 */
router.post('/resolve', function(req, res, next) {
	let challengeId = req.body.challengeId;
	let challengerScore = req.body.challengerScore;
	let challengeeScore = req.body.challengeeScore;
    let clientId = AuthService.verifyToken(req.token).playerId;
	
	if (!challengeId) return next(new Error('This is not a valid challenge.'));

	TeamChallenge.findById(challengeId).exec()
		.then(function(teamChallenge) {
            return TeamChallengeService.verifyAllowedToResolve(teamChallenge, clientId);
		})
		.then(TeamChallengeService.verifyForfeitIsNotRequired)
		.then(function(teamChallenge) {
			return ChallengeService.setScore(teamChallenge, challengerScore, challengeeScore);
		})
        .then(TeamChallengeService.updateLastGames)
		.then(function(teamChallenge) {
			if (challengerScore > challengeeScore) return ChallengeService.swapRanks(teamChallenge);
        })
		.then(function() {
            MailerService.resolvedTeamChallenge(challengeId);
			req.app.io.sockets.emit('challenge:team:resolved');
			res.json({message: 'Successfully resolved challenge.'});
		})
		.catch(next);
});

/**
 * Forfeits an expired challenge.
 * @param: challengeId
 */
router.post('/forfeit', function(req, res, next) {
	let challengeId = req.body.challengeId;
    let clientId = AuthService.verifyToken(req.token).playerId;

    TeamChallengeService.doForfeit(challengeId, clientId, req)
		.then(function() {
			res.json({message: 'Challenge successfully forfeited.'});
		})
		.catch(next);
});



module.exports = router;
