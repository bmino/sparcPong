const Util = require('./Util');

const ChallengeService = {
    TEMP_RANK: -1,
    CHALLENGE_ANYTIME: process.env.CHALLENGE_ANYTIME || false,
    CHALLENGE_BACK_DELAY_HOURS: process.env.CHALLENGE_BACK_DELAY_HOURS === undefined ? 12 : process.env.CHALLENGE_BACK_DELAY_HOURS,
    ALLOWED_OUTGOING: 1,
    ALLOWED_INCOMING: 1,

    verifyBusinessDay() {
        console.log('Verifying challenges can be issued today.');
        if (Util.isBusinessDay(new Date()) || ChallengeService.CHALLENGE_ANYTIME) return Promise.resolve();
        return Promise.reject(new Error('You can only issue challenges on business days'));
    },

    verifyReissueTime(challenges) {
        console.log('Verifying enough time has passed before another challenge can be issued.');
        if (!challenges || challenges.length === 0) return Promise.resolve(challenges);

        let mostRecentChallenge = challenges.sort((a, b) => {
            return (a.updatedAt > b.updatedAt) ? -1 : 1;
        })[0];

        let reissueTime = Util.addHours(mostRecentChallenge.updatedAt, ChallengeService.CHALLENGE_BACK_DELAY_HOURS);
        if (reissueTime < new Date()) return Promise.resolve(challenges);

        return Promise.reject(new Error(`You must wait at least ${ChallengeService.CHALLENGE_BACK_DELAY_HOURS} hours before re-challenging the same opponent`));
    },

    verifyRank(challenger, challengee) {
        console.log('Verifying rank limitations');
        if (challenger.rank < challengee.rank) return Promise.reject(new Error('You cannot challenger an opponent below your rank'));
        return Promise.resolve();
    },

    verifyTier(challenger, challengee) {
        console.log('Verifying tier limitations');
        let challengerTier = Util.getTier(challenger.rank);
        let challengeeTier = Util.getTier(challengee.rank);
        if (!challengerTier) return Promise.reject(new Error(`${challenger.username} is not in any tier`));
        if (!challengeeTier) return Promise.reject(new Error(`${challengee.username} is not in any tier`));

        if (Math.abs(challengerTier - challengeeTier) > 1)
            return Promise.reject(new Error('You cannot challenge an opponent beyond 1 tier'));
        return Promise.resolve();
    },

    verifyInvolvedByPlayerId(entity, playerId, message) {
        if (entity.challenger.toString() === playerId.toString() ||
            entity.challengee.toString() === playerId.toString()) return Promise.resolve(entity);
        return Promise.reject(new Error(message || 'Expected the player to be the challenger or challengee'));
    },

    verifyChallengerByPlayerId(entity, playerId, message) {
        if (entity.challenger.toString() === playerId.toString()) return Promise.resolve(entity);
        return Promise.reject(new Error(message || 'Expected the player to be the challenger'));
    },

    verifyChallengeeByPlayerId(entity, playerId, message) {
        if (entity.challengee.toString() === playerId.toString()) return Promise.resolve(entity);
        return Promise.reject(new Error(message || 'Expected the player to be the challengee'));
    },

    swapRanks(entity) {
        console.log('Swapping rankings');
        let populatedEntity = null;
        return entity.populate('challenger challengee').execPopulate()
            .then((populatedEntityResult) => {
                populatedEntity = populatedEntityResult;
                return ChallengeService.setRank(populatedEntity.challenger, ChallengeService.TEMP_RANK)
            })
            .then((challengerOldRank) => {
                return ChallengeService.setRank(populatedEntity.challengee, challengerOldRank);
            })
            .then((challengeeOldRank) => {
                return ChallengeService.setRank(populatedEntity.challenger, challengeeOldRank);
            });
    },

    setRank(entity, newRank) {
        console.log(`Changing rank of ${entity.username} from [${entity.rank}] to [${newRank}]`);
        return new Promise((resolve, reject) => {
            let oldRank = entity.rank;
            entity.rank = newRank;
            entity.save()
                .then(() => {return resolve(oldRank);})
                .catch(reject);
        });
    },

    setScore(challenge, challengerScore, challengeeScore) {
        console.log(`Setting score for challenge id [${challenge._id}]`);
        if (challengerScore < 0 || challengeeScore < 0) return Promise.reject(new Error('Both scores must be positive'));
        if (!Number.isInteger(challengerScore) || !Number.isInteger(challengeeScore)) return Promise.reject(new Error('Both scores must be integers'));
        if (challengerScore + challengeeScore < 2) return Promise.reject(new Error('A valid set consists of at least 2 games'));
        if (challengerScore + challengeeScore > 5) return Promise.reject(new Error('No more than 5 games should be played in a set'));
        if (challengerScore === challengeeScore) return Promise.reject(new Error('The final score cannot be equal'));

        challenge.setScore(challengerScore, challengeeScore);
        return challenge.save();
    },

    setForfeit(challenge) {
        console.log(`Setting forfeit for challenge id [${challenge._id}]`);
        challenge.setScore(undefined, undefined);
        return challenge.save();
    }
};


module.exports = ChallengeService;
