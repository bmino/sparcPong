const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Team = mongoose.model('Team');
const TeamChallenge = mongoose.model('TeamChallenge');
const ChallengeService = require('./ChallengeService');
const MailerService = require('./MailerService');
const Util = require('./Util');
const SocketService = require('./SocketService');

const TeamChallengeService = {
    ALLOWED_CHALLENGE_DAYS_TEAM: process.env.ALLOWED_CHALLENGE_DAYS_TEAM || 5,

    doChallenge(challengeeId, clientId) {
        return Promise.all([
            Team.getTeamByPlayerId(clientId),
            Team.findById(challengeeId).exec()
        ])
            .then((teams) => {
                if (!teams[0]) return Promise.reject(new Error('Player must be a member of a team'));
                if (!teams[1]) return Promise.reject(new Error('Specified challenge does not exist'));
                return Promise.resolve(teams);
            })
            .then(TeamChallengeService.verifyAllowedToChallenge)
            .then(TeamChallenge.createByTeams)
            .then((challenge) => {
                MailerService.newTeamChallenge(challenge._id);
                SocketService.IO.sockets.emit('challenge:team:issued');
            });
    },

    doResolve(challengeId, challengerScore, challengeeScore, clientId) {
        return TeamChallenge.findById(challengeId).exec()
            .then((teamChallenge) => {
                if (!teamChallenge) return Promise.reject(new Error('Invalid challenge id'));
                return Promise.resolve(teamChallenge);
            })
            .then((teamChallenge) => TeamChallengeService.verifyAllowedToResolve(teamChallenge, clientId))
            .then(TeamChallengeService.verifyForfeitIsNotRequired)
            .then((teamChallenge) => ChallengeService.setScore(teamChallenge, challengerScore, challengeeScore))
            .then((teamChallenge) => {
                if (challengerScore > challengeeScore) return ChallengeService.swapRanks(teamChallenge);
            })
            .then(() => {
                MailerService.resolvedTeamChallenge(challengeId);
                SocketService.IO.sockets.emit('challenge:team:resolved');
            });
    },

    doRevoke(challengeId, clientId) {
        return TeamChallenge.findById(challengeId).exec()
            .then((challenge) => {
                if (!challenge) return Promise.reject(new Error('Invalid challenge id'));
                return TeamChallengeService.verifyAllowedToRevoke(challenge, clientId);
            })
            .then(ChallengeService.verifyChallengeIsUnresolved)
            .then(TeamChallenge.removeByDocument)
            .then((challenge) => {
                MailerService.revokedTeamChallenge(challenge.challenger, challenge.challengee);
                SocketService.IO.sockets.emit('challenge:team:revoked');
            });
    },

    doForfeit(challengeId, clientId) {
        console.log(`Forfeiting challenge id [${challengeId}]`);

        return TeamChallenge.findById(challengeId).exec()
            .then((teamChallenge) => TeamChallengeService.verifyAllowedToForfeit(teamChallenge, clientId))
            .then(ChallengeService.verifyChallengeIsUnresolved)
            .then(ChallengeService.setForfeit)
            .then(ChallengeService.swapRanks)
            .then(() => {
                MailerService.forfeitedTeamChallenge(challengeId);
                SocketService.IO.sockets.emit('challenge:team:forfeited');
            });
    },

    verifyAllowedToChallenge(teams) {
        let [challenger, challengee] = teams;

        return Promise.all([
            TeamChallengeService.verifyActivePlayers(teams),
            TeamChallengeService.verifyActiveTeams(teams),
            TeamChallengeService.verifyChallengesBetweenTeams(teams),
            ChallengeService.verifyEnabled(),
            ChallengeService.verifyRank(challenger, challengee),
            ChallengeService.verifyTier(challenger, challengee),
            TeamChallenge.getResolvedBetweenTeams(teams).then(ChallengeService.verifyReissueTime)
        ])
            .then(() => teams);
    },

    verifyActivePlayers(teams) {
        return Promise.all([
            Player.findById(teams[0].leader).exec(),
            Player.findById(teams[0].partner).exec(),
            Player.findById(teams[1].leader).exec(),
            Player.findById(teams[1].partner).exec()])
        .then(players => {
            if (players.find(player => !player.active)) return Promise.reject(new Error('All players must have active accounts'));
            return Promise.resolve(teams);
        });
    },

    verifyActiveTeams(teams) {
        if (teams.find(t => t.active === false)) return Promise.reject(new Error('Both teams must have an active accounts'));
        return Promise.resolve(teams);
    },

    verifyChallengesBetweenTeams(teams) {
        let [ challenger, challengee ] = teams;

        if (challenger._id.toString() === challengee._id.toString()) return Promise.reject(new Error('Teams can not challenge themselves'));

        return Promise.all([
            TeamChallenge.countDocuments({challengee: challenger._id, winner: null}).exec(),
            TeamChallenge.countDocuments({challenger: challenger._id, winner: null}).exec(),
            TeamChallenge.countDocuments({challengee: challengee._id, winner: null}).exec(),
            TeamChallenge.countDocuments({challenger: challengee._id, winner: null}).exec(),
            TeamChallenge.getUnresolvedBetweenTeams(teams)
        ])
            .then(([challengerIncoming, challengerOutgoing, challengeeIncoming, challengeeOutgoing, challengesBetween]) => {
                if (challengerIncoming >= ChallengeService.ALLOWED_INCOMING) return Promise.reject(new Error(`${challenger.username} cannot have more than ${ChallengeService.ALLOWED_INCOMING} incoming challenges`));
                if (challengerOutgoing >= ChallengeService.ALLOWED_OUTGOING) return Promise.reject(new Error(`${challenger.username} cannot have more than ${ChallengeService.ALLOWED_OUTGOING} outgoing challenges`));
                if (challengeeIncoming >= ChallengeService.ALLOWED_INCOMING) return Promise.reject(new Error(`${challengee.username} cannot have more than ${ChallengeService.ALLOWED_INCOMING} incoming challenges`));
                if (challengeeOutgoing >= ChallengeService.ALLOWED_OUTGOING) return Promise.reject(new Error(`${challengee.username} cannot have more than ${ChallengeService.ALLOWED_OUTGOING} outgoing challenges`));
                if (challengesBetween.length >= 1) return Promise.reject(new Error(`A challenge already exists between ${challenger.username} and ${challengee.username}`));

                return Promise.resolve(teams);
            });
    },

    verifyAllowedToResolve(teamChallenge, playerId) {
        return TeamChallenge.populate(teamChallenge, 'challenger challengee')
            .then((populatedTeamChallenge) => {
                if (!populatedTeamChallenge.challenger.hasMemberByPlayerId(playerId) && !populatedTeamChallenge.challengee.hasMemberByPlayerId(playerId)) {
                    return Promise.reject(new Error('Only an involved player can resolve this challenge'));
                }
                return Promise.resolve(teamChallenge);
            });
    },

    verifyAllowedToForfeit(teamChallenge, playerId) {
        return TeamChallenge.populate(teamChallenge, 'challengee')
            .then((populatedTeamChallenge) => {
                if (!populatedTeamChallenge.challengee.hasMemberByPlayerId(playerId)) {
                    return Promise.reject(new Error('Only the challengee can forfeit this challenge'));
                }
                return Promise.resolve(teamChallenge);
            });
    },

    verifyAllowedToRevoke(teamChallenge, playerId) {
        return TeamChallenge.populate(teamChallenge, 'challenger')
            .then((populatedTeamChallenge) => {
                if (!populatedTeamChallenge.challenger.hasMemberByPlayerId(playerId)) {
                    return Promise.reject(new Error('Only the challenger can revoke this challenge'));
                }
                return Promise.resolve(teamChallenge);
            });
    },

    verifyForfeitIsNotRequired(challenge) {
        console.log('Verifying team challenge forfeit');

        const expires = Util.addBusinessDays(challenge.createdAt, TeamChallengeService.ALLOWED_CHALLENGE_DAYS_TEAM);
        if (expires < new Date()) return Promise.reject(new Error('This challenge has expired and must be forfeited'));
        return Promise.resolve(challenge);
    }
};


module.exports = TeamChallengeService;
