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
    const { challengeeId } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!challengeeId) return next(new Error('Challengee id is required'));

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
    const { teamId } = req.params;

    if (!teamId) return next(new Error('This is not a valid team'));

    Promise.all([
        TeamChallenge.getResolved(teamId).then(TeamChallenge.populateTeams),
        TeamChallenge.getOutgoing(teamId).then(TeamChallenge.populateTeamsAndTeamMembers),
        TeamChallenge.getIncoming(teamId).then(TeamChallenge.populateTeamsAndTeamMembers)
    ])
        .then(([resolved, outgoing, incoming]) => {
            res.json({message: {resolved, outgoing, incoming}});
        })
        .catch(next);

});

/**
 * Revoke challenge.
 * @param: challengeId
 */
router.delete('/revoke', (req, res, next) => {
    const { challengeId } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!challengeId) return next(new Error('Challenge id is required'));

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
    const { challengeId, challengerScore, challengeeScore } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!challengeId) return next(new Error('Challenge id is required'));
    if (challengerScore === undefined) return next(new Error('Challenger score is required'));
    if (challengeeScore === undefined) return next(new Error('Challengee score is required'));

    TeamChallengeService.doResolve(challengeId, challengerScore, challengeeScore, clientId)
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
    const { challengeId } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!challengeId) return next(new Error('Challenge id is required'));

    TeamChallengeService.doForfeit(challengeId, clientId)
        .then(() => {
            res.json({message: 'Challenge successfully forfeited.'});
        })
        .catch(next);
});


/**
 * Get wins and losses for a team
 * @param: teamId
 */
router.get('/record/:teamId', (req, res, next) => {
    const { teamId } = req.params;

    if (!teamId) return next(new Error('Team id is required'));

    TeamChallenge.getResolved(teamId)
        .then((challenges) => {
            const wins = challenges.filter(challenge => challenge.winner.toString() === teamId.toString()).length;
            const losses = challenges.length - wins;
            res.json({message: {wins, losses}});
        })
        .catch(next);
});


module.exports = router;
