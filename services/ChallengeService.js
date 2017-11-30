var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var Team = mongoose.model('Team');
var Challenge = mongoose.model('Challenge');
var Util = require('./Util');

var ChallengeService = {
    TEMP_RANK: -1,
    CHALLENGE_ANYTIME: process.env.CHALLENGE_ANYTIME || false,
    CHALLENGE_BACK_DELAY_HOURS: process.env.CHALLENGE_BACK_DELAY_HOURS || 12,
    ALLOWED_OUTGOING: 1,
    ALLOWED_INCOMING: 1,

    verifyBusinessDay : verifyBusinessDay,
    verifyReissueTime : verifyReissueTime,
    verifyRank : verifyRank,
    verifyTier : verifyTier,

    verifyInvolvedByPlayerId : verifyInvolvedByPlayerId,
    verifyChallengerByPlayerId : verifyChallengerByPlayerId,
    verifyChallengeeByPlayerId : verifyChallengeeByPlayerId,

    swapRanks : swapRanks,
    setRank : setRank,

    setScore : setScore,
    setForfeit : setForfeit
};

module.exports = ChallengeService;


function verifyBusinessDay() {
    console.log('Verifying challenges can be issued today.');
    return new Promise(function(resolve, reject) {
        if (Util.isBusinessDay(new Date()) || ChallengeService.CHALLENGE_ANYTIME) return resolve();
        return reject(new Error('You can only issue challenges on business days.'));
    });
}

function verifyReissueTime(challenges) {
    console.log('Verifying enough time has passed before another challenge can be issued.');
    return new Promise(function(resolve, reject) {
        if (!challenges || challenges.length === 0) return resolve(challenges);

        var mostRecentChallenge = challenges.sort(function (a, b) {
            return (a.updatedAt > b.updatedAt) ? -1 : 1;
        })[0];

        var reissueTime = Util.addHours(mostRecentChallenge.updatedAt, ChallengeService.CHALLENGE_BACK_DELAY_HOURS);
        if (reissueTime < new Date()) return resolve(challenges);

        return reject(new Error('You must wait at least ' + ChallengeService.CHALLENGE_BACK_DELAY_HOURS + ' hours before re-challenging the same opponent.'));
    });
}

function verifyRank(challenger, challengee) {
    console.log('Verifying rank limitations');
    return new Promise(function(resolve, reject) {
        if (challenger.rank < challengee.rank)
            return reject(new Error('You cannot challenger an opponent below your rank.'));
        return resolve();
    });
}

function verifyTier(challenger, challengee) {
    console.log('Verifying tier limitations');
    return new Promise(function(resolve, reject) {
        if (Math.abs(Util.getTier(challenger.rank) - Util.getTier(challengee.rank)) > 1)
            return reject(new Error('You cannot challenge an opponent beyond 1 tier.'));
        return resolve();
    });
}

function verifyInvolvedByPlayerId(entity, playerId, message) {
    return new Promise(function(resolve, reject) {
        if (entity.challenger.toString() === playerId ||
            entity.challengee.toString() === playerId) return resolve(entity);
        return reject(new Error(message || 'Expected the player to be the challenger or challengee.'));
    });
}

function verifyChallengerByPlayerId(entity, playerId, message) {
    return new Promise(function(resolve, reject) {
        if (entity.challenger.toString() === playerId) return resolve(entity);
        return reject(new Error(message || 'Expected the player to be the challenger.'));
    });
}

function verifyChallengeeByPlayerId(entity, playerId, message) {
    return new Promise(function(resolve, reject) {
        if (entity.challengee.toString() === playerId) return resolve(entity);
        return reject(new Error(message || 'Expected the player to be the challengee.'));
    });
}

function swapRanks(entity) {
    console.log('Swapping rankings');
    var populatedEntity = null;
    return new Promise(function(resolve, reject) {
        return entity.populate('challenger challengee').execPopulate()
            .then(function(populatedEntityResult) {
                populatedEntity = populatedEntityResult;
                return ChallengeService.setRank(populatedEntity.challenger, ChallengeService.TEMP_RANK)
            })
            .then(function(challengerOldRank) {
                return ChallengeService.setRank(populatedEntity.challengee, challengerOldRank);
            })
            .then(function(challengeeOldRank) {
                return ChallengeService.setRank(populatedEntity.challenger, challengeeOldRank);
            })
            .then(resolve)
            .catch(reject);
    });
}

function setRank(entity, newRank) {
    console.log('Changing rank of ' + entity.username + ' from [' + entity.rank + '] to [' + newRank + ']');
    return new Promise(function (resolve, reject) {
        var oldRank = entity.rank;
        entity.rank = newRank;
        entity.save()
            .then(function() {return resolve(oldRank);})
            .catch(reject);
    });
}

function setScore(challenge, challengerScore, challengeeScore) {
    console.log('Setting score for challenge id [' + challenge._id + ']');
    return new Promise(function(resolve, reject) {
        if (challengerScore < 0 || challengeeScore < 0) return reject(new Error('Both scores must be positive.'));
        if (!Number.isInteger(challengerScore) || !Number.isInteger(challengeeScore)) return reject(new Error('Both scores must be integers.'));
        if (challengerScore + challengeeScore < 2) return reject(new Error('A valid set consists of at least 2 games.'));
        if (challengerScore + challengeeScore > 5) return reject(new Error('No more than 5 games should be played in a set.'));
        if (challengerScore === challengeeScore) return reject(new Error('The final score cannot be equal.'));

        challenge.setScore(challengerScore, challengeeScore);
        return challenge.save()
            .then(resolve)
            .catch(reject);
    });
}

function setForfeit(challenge) {
    console.log('Setting forfeit for challenge id [' + challenge._id + ']');
    return new Promise(function(resolve, reject) {
        challenge.setScore(undefined, undefined);
        return challenge.save()
            .then(resolve)
            .catch(reject);
    });
}
