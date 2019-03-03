const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Team = mongoose.model('Team');
const TeamChallenge = mongoose.model('TeamChallenge');
const ChallengeService = require('./ChallengeService');
const MailerService = require('./MailerService');
const Util = require('./Util');

const TeamChallengeService = {
    ALLOWED_CHALLENGE_DAYS_TEAM: process.env.ALLOWED_CHALLENGE_DAYS_TEAM || 5,

    doChallenge(challengeeId, clientId, req) {
        return Promise.all([
            Team.getTeamsByPlayerId(clientId),
            Team.findById(challengeeId).exec()
        ])
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
            });
    },

    resolveChallenge(challengeId, challengerScore, challengeeScore, clientId, req) {
        if (!challengeId) return Promise.reject(new Error('This is not a valid challenge.'));

        return TeamChallenge.findById(challengeId).exec()
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
            });
    },

    doRevoke(challengeId, clientId, req) {
        if (!challengeId) return Promise.reject(new Error('This is not a valid challenge id.'));

        return TeamChallenge.findById(challengeId).exec()
            .then(function(challenge) {
                if (!challenge) return Promise.reject(new Error('Could not find the challenge.'));
                return TeamChallengeService.verifyAllowedToRevoke(challenge, clientId);
            })
            .then(TeamChallenge.removeByDocument)
            .then(function(challenge) {
                MailerService.revokedTeamChallenge(challenge.challenger, challenge.challengee);
                req.app.io.sockets.emit('challenge:team:revoked');
            });
    },

    doForfeit(challengeId, clientId, req) {
        if (!challengeId) return Promise.reject(new Error('This is not a valid challenge id.'));

        console.log(`Forfeiting challenge id [${challengeId}]`);

        return TeamChallenge.findById(challengeId).exec()
            .then(function(teamChallenge) {
                return TeamChallengeService.verifyAllowedToForfeit(teamChallenge, clientId);
            })
            .then(ChallengeService.setForfeit)
            .then(TeamChallengeService.updateLastGames)
            .then(ChallengeService.swapRanks)
            .then(function() {
                MailerService.forfeitedTeamChallenge(challengeId);
                req.app.io.sockets.emit('challenge:team:forfeited');
            });
    },

    verifyAllowedToChallenge(teams) {
        let challenger = teams[0];
        let challengee = teams[1];
        return new Promise(function(resolve, reject) {

            let existingChallengesCheck = TeamChallengeService.verifyChallengesBetweenTeams(teams);
            let rankCheck = ChallengeService.verifyRank(challenger, challengee);
            let tierCheck = ChallengeService.verifyTier(challenger, challengee);
            let reissueTimeCheck = TeamChallenge.getResolvedBetweenTeams(teams).then(ChallengeService.verifyReissueTime);
            let businessDayCheck = ChallengeService.verifyBusinessDay();

            return Promise.all([existingChallengesCheck, rankCheck, tierCheck, reissueTimeCheck, businessDayCheck])
                .then(function() {return resolve(teams);})
                .catch(reject);
        });
    },

    verifyChallengesBetweenTeams(teams) {
        let challenger = teams[0];
        let challengee = teams[1];
        return new Promise(function(resolve, reject) {

            if (challenger._id.toString() === challengee._id.toString()) return reject(new Error('Teams can not challenge themselves.'));
            let challengerIncoming = TeamChallenge.count({challengee: challenger._id, winner: null}).exec();
            let challengerOutgoing = TeamChallenge.count({challenger: challenger._id, winner: null}).exec();
            let challengeeIncoming = TeamChallenge.count({challengee: challengee._id, winner: null}).exec();
            let challengeeOutgoing = TeamChallenge.count({challenger: challengee._id, winner: null}).exec();
            let challengesBetween  = TeamChallenge.getUnresolvedBetweenTeams(teams);

            return Promise.all([challengerIncoming, challengerOutgoing, challengeeIncoming, challengeeOutgoing, challengesBetween])
                .then(function (counts) {
                    if (counts[0] >= ChallengeService.ALLOWED_INCOMING) return reject(new Error(`${challenger.username} cannot have more than ${ChallengeService.ALLOWED_INCOMING} incoming challenges.`));
                    if (counts[1] >= ChallengeService.ALLOWED_OUTGOING) return reject(new Error(`${challenger.username} cannot have more than ${ChallengeService.ALLOWED_OUTGOING} outgoing challenges.`));
                    if (counts[2] >= ChallengeService.ALLOWED_INCOMING) return reject(new Error(`${challengee.username} cannot have more than ${ChallengeService.ALLOWED_INCOMING} incoming challenges.`));
                    if (counts[3] >= ChallengeService.ALLOWED_OUTGOING) return reject(new Error(`${challengee.username} cannot have more than ${ChallengeService.ALLOWED_OUTGOING} outgoing challenges.`));
                    if (counts[4].length >= 1) return reject(new Error(`A challenge already exists between ${challenger.username} and ${challengee.username}`));

                    return resolve(teams);
                })
                .then(resolve)
                .catch(reject);
        });
    },

    verifyAllowedToResolve(teamChallenge, playerId) {
        return new Promise(function(resolve, reject) {
            TeamChallenge.populate(teamChallenge, 'challenger challengee')
                .then(function(populatedTeamChallenge) {
                    if (populatedTeamChallenge.challenger.hasMemberByPlayerId(playerId)) {
                        return resolve(teamChallenge);
                    }
                    if (populatedTeamChallenge.challengee.hasMemberByPlayerId(playerId)) {
                        return resolve(teamChallenge);
                    }
                    return reject(new Error('Only players involved in the challenge can resolve it.'));
                })
                .catch(reject);
        });
    },

    verifyAllowedToForfeit(teamChallenge, playerId) {
        return new Promise(function(resolve, reject) {
            TeamChallenge.populate(teamChallenge, 'challengee')
                .then(function(populatedTeamChallenge) {
                    if (populatedTeamChallenge.challengee.hasMemberByPlayerId(playerId)) {
                        return resolve(teamChallenge);
                    }
                    return reject(new Error('Only the challengee can forfeit a challenge.'));
                })
                .catch(reject);
        });
    },

    verifyAllowedToRevoke(teamChallenge, playerId) {
        return new Promise(function(resolve, reject) {
            TeamChallenge.populate(teamChallenge, 'challenger')
                .then(function(populatedTeamChallenge) {
                    if (populatedTeamChallenge.challenger.hasMemberByPlayerId(playerId)) {
                        return resolve(teamChallenge);
                    }
                    return reject(new Error('Only the challenger can revoke a challenge.'));
                })
                .catch(reject);
        });
    },

    verifyForfeitIsNotRequired(challenge) {
        console.log('Verifying team challenge forfeit');
        return new Promise(function(resolve, reject) {
            let dateIssued = challenge.createdAt;
            let expires = Util.addBusinessDays(dateIssued, TeamChallengeService.ALLOWED_CHALLENGE_DAYS_TEAM);
            if (expires < new Date()) return reject(new Error('This challenge has expired. It must be forfeited.'));
            return resolve(challenge);
        });
    },

    updateLastGames(challenge) {
        console.log(`Updating last games for the challenge with id of [${challenge._id}]`);
        return new Promise(function(resolve, reject) {
            return TeamChallenge.populateById(challenge._id)
                .then(function(c) {
                    let setTimeOption = {$set: {lastGame: c.updatedAt}};
                    let challengerLeaderUpdate = Player.findByIdAndUpdate(c.challenger.leader._id, setTimeOption).exec();
                    let challengerPartnerUpdate = Player.findByIdAndUpdate(c.challenger.partner._id, setTimeOption).exec();
                    let challengeeLeaderUpdate = Player.findByIdAndUpdate(c.challengee.leader._id, setTimeOption).exec();
                    let challengeePartnerUpdate = Player.findByIdAndUpdate(c.challengee.partner._id, setTimeOption).exec();

                    return Promise.all([challengerLeaderUpdate, challengerPartnerUpdate, challengeeLeaderUpdate, challengeePartnerUpdate])
                        .then(function() {return resolve(challenge);})
                        .catch(reject);
                });

        });
    }
};


module.exports = TeamChallengeService;
