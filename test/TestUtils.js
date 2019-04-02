const mongoose = require('mongoose');
require('../models'); // Register schemas

const Player = mongoose.model('Player');
const Team = mongoose.model('Team');
const Authorization = mongoose.model('Authorization');
const Alert = mongoose.model('Alert');
const Challenge = mongoose.model('Challenge');
const TeamChallenge = mongoose.model('TeamChallenge');

const AuthService = require('../services/AuthService');

const JSON_PLAYERS = require('./json/players.json');
const JSON_TEAMS = require('./json/teams.json');
const JSON_AUTHORIZATIONS = require('./json/authorizations.json');
const JSON_ALERTS = require('./json/alerts.json');
const JSON_PLAYER_CHALLENGES = require('./json/challenges.json');
const JSON_TEAM_CHALLENGES = require('./json/teamChallenges.json');

const MONGO_OPTIONS = {
    useCreateIndex: true,
    useNewUrlParser: true,
    promiseLibrary: Promise
};

const TestUtils = {

    getPlayerById(playerId) {
        return JSON_PLAYERS.find(p => p._id.toString() === playerId.toString());
    },

    getPlayerByRank(playerRank) {
        return JSON_PLAYERS.find(p => p.rank.toString() === playerRank.toString());
    },

    getPlayers() {
        return JSON_PLAYERS;
    },

    getTeamById(teamId) {
        return JSON_TEAMS.find(t => t._id.toString() === teamId.toString());
    },

    getTeamByRank(teamRank) {
        return JSON_TEAMS.find(t => t.rank.toString() === teamRank.toString());
    },

    getTeams() {
        return JSON_TEAMS;
    },

    getAuthorizations() {
        return JSON_AUTHORIZATIONS;
    },

    getAuthorizationByPlayerId(playerId) {
        return JSON_AUTHORIZATIONS.find(a => a.user.toString() === playerId.toString());
    },

    getAlerts() {
        return JSON_ALERTS;
    },

    getAlertById(alertId) {
        return JSON_ALERTS.find(a => a._id.toString() === alertId.toString());
    },

    getPlayerChallenges() {
        return JSON_PLAYER_CHALLENGES;
    },

    getPlayerChallengesInvolvingPlayerId(playerId) {
        return JSON_PLAYER_CHALLENGES.filter(c => (c.challenger === playerId || c.challengee === playerId));
    },

    getTeamChallenges() {
        return JSON_TEAM_CHALLENGES;
    },

    getTeamChallengesInvolvingTeamId(teamId) {
        return JSON_TEAM_CHALLENGES.filter(c => (c.challenger === teamId || c.challengee === teamId));
    },

    getMongoOptions() {
        return MONGO_OPTIONS;
    },

    createToken(playerId) {
        return AuthService.createToken(playerId);
    },

    wipeDatabase() {
        return Promise.all([
            Player.deleteMany({}).exec(),
            Team.deleteMany({}).exec(),
            Authorization.deleteMany({}).exec(),
            Alert.deleteMany({}).exec(),
            Challenge.deleteMany({}).exec(),
            TeamChallenge.deleteMany({}).exec()
        ]);
    },

    seedDatabase() {
        return Promise.all([
            Player.insertMany(JSON_PLAYERS),
            Team.insertMany(JSON_TEAMS),
            Authorization.insertMany(JSON_AUTHORIZATIONS),
            Alert.insertMany(JSON_ALERTS),
            Challenge.insertMany(JSON_PLAYER_CHALLENGES),
            TeamChallenge.insertMany(JSON_TEAM_CHALLENGES)
        ]);
    },

    resetDatabase() {
        return TestUtils.wipeDatabase()
            .then(TestUtils.seedDatabase);
    }

};

module.exports = TestUtils;

