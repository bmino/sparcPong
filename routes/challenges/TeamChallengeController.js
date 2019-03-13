const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TeamChallenge = mongoose.model('TeamChallenge');
const TeamChallengeService = require('../../services/TeamChallengeService');
const AuthService = require('../../services/AuthService');

/**
 * Issue new challenge.
 * @param: challengerId
 * @param: challengeeId
 */
router.post('/', (req, res, next) => {
    let challengeeId = req.body.challengeeId;
    let clientId = AuthService.verifyToken(req.token).playerId;

    TeamChallengeService.doChallenge(challengeeId, clientId)
        .then(() => {
            res.json({message: 'Challenge issued!'});
        })
        .catch(next);
});

/**
 * Get all challenges involving a team.
 * @param: teamId
 */
router.get('/:teamId', (req, res, next) => {
    let teamId = req.params.teamId;

    if (!teamId) return next(new Error('This is not a valid team.'));

    let resolvedChallenges = TeamChallenge.getResolved(teamId)
        .then(TeamChallenge.populateTeams);

    let outgoingChallenges = TeamChallenge.getOutgoing(teamId)
        .then(TeamChallenge.populateTeamsAndTeamMembers);

    let incomingChallenges = TeamChallenge.getIncoming(teamId)
        .then(TeamChallenge.populateTeamsAndTeamMembers);

    Promise.all([resolvedChallenges, outgoingChallenges, incomingChallenges])
        .then((challenges) => {
            res.json({message: {resolved: challenges[0], outgoing: challenges[1], incoming: challenges[2]}});
        })
        .catch(next);

});

/**
 * Revoke challenge.
 * @param: challengeId
 */
router.delete('/revoke', (req, res, next) => {
    let challengeId = req.body.challengeId;
    let clientId = AuthService.verifyToken(req.token).playerId;

    TeamChallengeService.doRevoke(challengeId, clientId)
        .then(() => {
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
router.post('/resolve', (req, res, next) => {
    let challengeId = req.body.challengeId;
    let challengerScore = req.body.challengerScore;
    let challengeeScore = req.body.challengeeScore;
    let clientId = AuthService.verifyToken(req.token).playerId;

    TeamChallengeService.resolveChallenge(challengeId, challengerScore, challengeeScore, clientId)
        .then(() => {
            res.json({message: 'Successfully resolved challenge.'});
        })
        .catch(next);
});

/**
 * Forfeits an expired challenge.
 * @param: challengeId
 */
router.post('/forfeit', (req, res, next) => {
    let challengeId = req.body.challengeId;
    let clientId = AuthService.verifyToken(req.token).playerId;

    TeamChallengeService.doForfeit(challengeId, clientId)
        .then(() => {
            res.json({message: 'Challenge successfully forfeited.'});
        })
        .catch(next);
});


module.exports = router;
