var mongoose = require('mongoose');
var Team = mongoose.model('Team');
var Challenge = mongoose.model('Challenge');
var Util = require('./Util');

var ChallengeService = {
    TEMP_RANK: -1,
    CHALLENGE_ANYTIME: process.env.CHALLENGE_ANYTIME || false,
    CHALLENGE_BACK_DELAY_HOURS: process.env.CHALLENGE_BACK_DELAY_HOURS || 0,
    ALLOWED_OUTGOING: 1,
    ALLOWED_INCOMING: 1,
    BASE_POINT_AWARD: 10,

    verifyBusinessDay : verifyBusinessDay,
    verifyReissueTime : verifyReissueTime,
    verifyRank : verifyRank,
    verifyTier : verifyTier,

    verifyInvolvedByPlayerId : verifyInvolvedByPlayerId,
    verifyChallengerByPlayerId : verifyChallengerByPlayerId,
    verifyChallengeeByPlayerId : verifyChallengeeByPlayerId,

    swapRanks : swapRanks,
    setRank : setRank,

    addPoints : addPoints,
    resolveGame : resolveGame,
    calculatePoints : calculatePoints,

    setScore : setScore,
    setForfeit : setForfeit
};

module.exports = ChallengeService;
var Player = mongoose.model('Player');


function verifyBusinessDay() {
    console.log('Verifying challenges can be issued today.');
    if (Util.isBusinessDay(new Date()) || ChallengeService.CHALLENGE_ANYTIME) return Promise.resolve();
    return Promise.reject(new Error('You can only issue challenges on business days.'));
}

function verifyReissueTime(challenges) {
    console.log('Verifying enough time has passed before another challenge can be issued.');
    if (!challenges || challenges.length === 0) return Promise.resolve(challenges);

    var mostRecentChallenge = challenges.sort(function (a, b) {
        return (a.updatedAt > b.updatedAt) ? -1 : 1;
    })[0];

    var reissueTime = Util.addHours(mostRecentChallenge.updatedAt, ChallengeService.CHALLENGE_BACK_DELAY_HOURS);
    if (reissueTime < new Date()) return Promise.resolve(challenges);

    return Promise.reject(new Error('You must wait at least ' + ChallengeService.CHALLENGE_BACK_DELAY_HOURS + ' hours before re-challenging the same opponent.'));
}

function verifyRank(challenger, challengee) {
    console.log('Verifying rank limitations');
    if (challenger.rank < challengee.rank) return Promise.reject(new Error('You cannot challenger an opponent below your rank.'));
    return Promise.resolve();
}

function verifyTier(challenger, challengee) {
    console.log('Verifying tier limitations');
    var challengerTier = Util.getTier(challenger.rank);
    var challengeeTier = Util.getTier(challengee.rank);
    if (!challengerTier) return Promise.reject(new Error(challenger.username + ' is not in any tier'));
    if (!challengeeTier) return Promise.reject(new Error(challengee.username + ' is not in any tier'));

    if (Math.abs(challengerTier - challengeeTier) > 1)
        return Promise.reject(new Error('You cannot challenge an opponent beyond 1 tier.'));
    return Promise.resolve();
}

function verifyInvolvedByPlayerId(entity, playerId, message) {
    if (entity.challenger.toString() === playerId.toString() ||
        entity.challengee.toString() === playerId.toString()) return Promise.resolve(entity);
    return Promise.reject(new Error(message || 'Expected the player to be the challenger or challengee.'));
}

function verifyChallengerByPlayerId(entity, playerId, message) {
    if (entity.challenger.toString() === playerId.toString()) return Promise.resolve(entity);
    return Promise.reject(new Error(message || 'Expected the player to be the challenger.'));
}

function verifyChallengeeByPlayerId(entity, playerId, message) {
    if (entity.challengee.toString() === playerId.toString()) return Promise.resolve(entity);
    return Promise.reject(new Error(message || 'Expected the player to be the challengee.'));
}

function swapRanks(entity) {
    console.log('Swapping rankings');
    var populatedEntity = null;
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
        });
}

function resolveGame(entity) {
    console.log('Finalizing ladder game');
    return entity.populate('challenger challengee').execPopulate()
        .then(function(result) {
            if (result.challengerScore > result.challengeeScore){
                return calculatePoints(result.challenger, result.challengee);
            }
            return calculatePoints(result.challengee, result.challenger);
        });


}

function calculatePoints(winner, loser) {
    console.log('Calculate point award for winning player ' + winner.rank);
    pointRatio = winner.rank / loser.rank;
    console.log(pointRatio + ' ' + ChallengeService.BASE_POINT_AWARD);
    addPoints(winner, pointRatio * ChallengeService.BASE_POINT_AWARD);
    refreshRanks();
}

function addPoints(entity, points) {
    console.log(entity.username);
    console.log(points);
    Player.findOne({username: entity.username}, function (err, user) {
        user.points = user.points + points;
        user.save(function (err) {
            if(err) {
                console.error('ERROR!');
            }
        });
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

function refreshRanks() {
    console.log('Refreshing all ranks');
    Player.find({}, function(err, players) {
        players.sort((a, b) => parseFloat(b.points) - parseFloat(a.points));
        var rank = 1;
        players.forEach( function(player) {
            console.log('Changing rank of ' + player.username + ' from [' + player.rank + '] to [' + rank + ']');
            player.rank = rank;
            rank++;
            player.save();
        });
    });
}

function setScore(challenge, challengerScore, challengeeScore) {
    console.log('Setting score for challenge id [' + challenge._id + ']');
    if (challengerScore < 0 || challengeeScore < 0) return Promise.reject(new Error('Both scores must be positive.'));
    if (!Number.isInteger(challengerScore) || !Number.isInteger(challengeeScore)) return Promise.reject(new Error('Both scores must be integers.'));
    if (challengerScore + challengeeScore < 2) return Promise.reject(new Error('A valid set consists of at least 2 games.'));
    if (challengerScore + challengeeScore > 5) return Promise.reject(new Error('No more than 5 games should be played in a set.'));
    if (challengerScore === challengeeScore) return Promise.reject(new Error('The final score cannot be equal.'));

    challenge.setScore(challengerScore, challengeeScore);
    return challenge.save();
}

function setForfeit(challenge) {
    console.log('Setting forfeit for challenge id [' + challenge._id + ']');
    challenge.setScore(undefined, undefined);
    return challenge.save();
}
