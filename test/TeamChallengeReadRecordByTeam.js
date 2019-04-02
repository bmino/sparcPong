const mongoose = require('mongoose');
require('../models'); // Register schemas
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');

const RESOLVED_TEAM_CHALLENGE = TestUtils.getTeamChallenges().find(c => c.winner !== null);
const RESOLVED_TEAM_CHALLENGE_CHALLENGER_WINS = TestUtils.getTeamChallenges().filter(c => c.winner === RESOLVED_TEAM_CHALLENGE.challenger).length;
const RESOLVED_TEAM_CHALLENGE_CHALLENGER_LOSSES = TestUtils.getTeamChallengesInvolvingTeamId(RESOLVED_TEAM_CHALLENGE.challenger).filter(c => c.winner !== null && c.winner !== RESOLVED_TEAM_CHALLENGE.challenger).length;
const RESOLVED_TEAM_CHALLENGE_CHALLENGEE_WINS = TestUtils.getTeamChallenges().filter(c => c.winner === RESOLVED_TEAM_CHALLENGE.challengee).length;
const RESOLVED_TEAM_CHALLENGE_CHALLENGEE_LOSSES = TestUtils.getTeamChallengesInvolvingTeamId(RESOLVED_TEAM_CHALLENGE.challengee).filter(c => c.winner !== null && c.winner !== RESOLVED_TEAM_CHALLENGE.challengee).length;


describe('fetching team challenge records', function() {

    let mongoServer, requester, playerToken;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        expect(RESOLVED_TEAM_CHALLENGE, 'resolved team challenge').not.to.be.undefined;

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => TestUtils.createToken(TestUtils.getPlayerByRank(1))).then((token) => playerToken = token);
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .get(`/api/challenge/team/record/${RESOLVED_TEAM_CHALLENGE.challenger}`)
            .then((res) => {
                expect(res).to.have.status(401);
                expect(res.body).to.be.empty;
            });
    });

    it('returns zeros for wins and losses when there are none', function() {
        return requester
            .get(`/api/challenge/team/record/000000000000000000000014`)
            .set('Authorization', `JWT ${playerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challenger wins').to.equal(0);
                expect(res.body.message.losses, 'challenger losses').to.equal(0);
            });
    });

    it('returns records for deactivated players', function() {
        const DEACTIVATED_TEAM = TestUtils.getTeams().find(t => t.active === false);
        return requester
            .get(`/api/challenge/team/record/${DEACTIVATED_TEAM._id}`)
            .set('Authorization', `JWT ${playerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challenger wins').to.be.a('number');
                expect(res.body.message.losses, 'challenger losses').to.be.a('number');
            });
    });

    it('fetches score for challenger as challenger', function() {
        return requester
            .get(`/api/challenge/team/record/${RESOLVED_TEAM_CHALLENGE.challenger}`)
            .set('Authorization', `JWT ${playerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challenger wins').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGER_WINS);
                expect(res.body.message.losses, 'challenger losses').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGER_LOSSES);
            });
    });

    it('fetches score for challenger as challengee', function() {
        return requester
            .get(`/api/challenge/team/record/${RESOLVED_TEAM_CHALLENGE.challenger}`)
            .set('Authorization', `JWT ${playerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challenger wins').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGER_WINS);
                expect(res.body.message.losses, 'challenger losses').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGER_LOSSES);
            });
    });

    it('fetches score for challenger as non-challenger', function() {
        return requester
            .get(`/api/challenge/team/record/${RESOLVED_TEAM_CHALLENGE.challenger}`)
            .set('Authorization', `JWT ${playerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challenger wins').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGER_WINS);
                expect(res.body.message.losses, 'challenger losses').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGER_LOSSES);
            });
    });

    it('fetches score for challengee as challenger', function() {
        return requester
            .get(`/api/challenge/team/record/${RESOLVED_TEAM_CHALLENGE.challengee}`)
            .set('Authorization', `JWT ${playerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challengee wins').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGEE_WINS);
                expect(res.body.message.losses, 'challengee losses').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGEE_LOSSES);
            });
    });

    it('fetches score for challengee as challengee', function() {
        return requester
            .get(`/api/challenge/team/record/${RESOLVED_TEAM_CHALLENGE.challengee}`)
            .set('Authorization', `JWT ${playerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challengee wins').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGEE_WINS);
                expect(res.body.message.losses, 'challengee losses').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGEE_LOSSES);
            });
    });

    it('fetches score for challengee as non-challenger', function() {
        return requester
            .get(`/api/challenge/team/record/${RESOLVED_TEAM_CHALLENGE.challengee}`)
            .set('Authorization', `JWT ${playerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challengee wins').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGEE_WINS);
                expect(res.body.message.losses, 'challengee losses').to.equal(RESOLVED_TEAM_CHALLENGE_CHALLENGEE_LOSSES);
            });
    });

});
