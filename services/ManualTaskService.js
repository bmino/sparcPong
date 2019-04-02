const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const Challenge = mongoose.model('Challenge');
const TeamChallenge = mongoose.model('TeamChallenge');
const PlayerChallengeService = require('./PlayerChallengeService');
const TeamChallengeService = require('./TeamChallengeService');
const MailerService = require('./MailerService');

const ManualTaskService = {

    autoChallenge() {
        console.log('[Manual] - Challenge task has been engaged');

        return Player.find({}).sort('rank').exec()
            .then((players) => ManualTaskService.issueChallenges(players, players.length-1, players.length-2));
    },

    autoForfeitSingles() {
        console.log('[Manual] - Forfeit task (singles) has been engaged');

        return Challenge.getAllExpired()
            .then((challenges) => {
                console.log(`[Manual] - Found ${challenges.length} expired challenges (singles)`);

                let forfeitPromises = [];
                challenges.forEach((challenge) => {
                    let promise = PlayerChallengeService.doForfeit(challenge._id, challenge.challengee);
                    forfeitPromises.push(promise);
                });

                return Promise.all(forfeitPromises);
            });
    },

    autoForfeitDoubles() {
        console.log('[Manual] - Forfeit task (doubles) has been engaged');

        return TeamChallenge.getAllExpired()
            .then((challenges) => {
                console.log(`[Manual] - Found ${challenges.length} expired challenges (doubles)`);

                let forfeitPromises = [];
                challenges.forEach((challenge) => {
                    let promise = TeamChallengeService.doForfeit(challenge._id, challenge.challengee.leader);
                    forfeitPromises.push(promise);
                });

                return Promise.all(forfeitPromises);
            });
    },

    deactivatePlayer(playerId) {
        console.log('[Manual] - Deactivating player');

        return Promise.all([
            Player.findById(playerId),
            Challenge.getIncoming(playerId),
            Challenge.getOutgoing(playerId)
        ])
            .then(([player, incoming, outgoing]) => {
                if (!player) return Promise.reject(new Error('Could not find player'));
                if (!player.active) return Promise.reject(new Error('Player is not currently active'));
                if (incoming.length) return PlayerChallengeService.doForfeit(incoming[0]._id, playerId);
                if (outgoing.length) return PlayerChallengeService.doRevoke(outgoing[0]._id, playerId);
            })
            .then(() => Player.findByIdAndUpdate(playerId, {active: false, rank: -404}).exec())
            .then((inactivePlayer) => Player.update({rank: {$gt: inactivePlayer.rank}}, {$inc: {rank: -1}}, {multi: true}).exec());
    },

    activatePlayer(playerId) {
        console.log('[Manual] - Activating player');

        return Promise.all([
            Player.findById(playerId),
            Player.lowestRank()
        ])
            .then(([player, lowestRank]) => {
                if (!player) return Promise.reject(new Error('Could not find player'));
                if (player.active) return Promise.reject(new Error('Player is already active'));
                return Player.findByIdAndUpdate(playerId, {active: true, rank: lowestRank+1}).exec();
            });
    },

    issueChallenges(players, challengerIndex, challengeeIndex, issued) {
        if (!issued) issued = 0;

        // Done checking players
        if (challengerIndex === 0) return Promise.resolve(issued);
        // Must check next player
        if (challengeeIndex < 0) return ManualTaskService.issueChallenges(players, --challengerIndex, challengerIndex - 1, issued);

        console.log(`[Manual] - Attempting to match ${players[challengerIndex].username} vs ${players[challengeeIndex].username}`);
        return PlayerChallengeService.doChallenge(players[challengeeIndex]._id, players[challengerIndex]._id)
            .then((issuedChallenge) => {
                console.log('[Manual] - Challenge issued successfully');
                MailerService.newAutoChallenge(issuedChallenge._id);
                issued++;
                challengerIndex--;
                challengeeIndex = challengerIndex - 1;
            })
            .catch((err) => {
                console.error(`[Manual] - ${err}`);
                challengeeIndex--;
            })
            .then(() => ManualTaskService.issueChallenges(players, challengerIndex, challengeeIndex, issued));
    }

};


module.exports = ManualTaskService;
