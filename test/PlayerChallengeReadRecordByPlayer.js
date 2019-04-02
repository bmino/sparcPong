const mongoose = require('mongoose');
require('../models'); // Register schemas
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');

const CHALLENGE = TestUtils.getPlayerChallenges().find(c => c._id === "000000000000000000000006");
const RESOLVED_CHALLENGE_CHALLENGER_WINS = TestUtils.getPlayerChallenges().filter(c => c.winner === CHALLENGE.challenger).length;
const RESOLVED_CHALLENGE_CHALLENGER_LOSSES = TestUtils.getPlayerChallengesInvolvingPlayerId(CHALLENGE.challenger).filter(c => c.winner !== null && c.winner !== CHALLENGE.challenger).length;
const RESOLVED_CHALLENGE_CHALLENGEE_WINS = TestUtils.getPlayerChallenges().filter(c => c.winner === CHALLENGE.challengee).length;
const RESOLVED_CHALLENGE_CHALLENGEE_LOSSES = TestUtils.getPlayerChallengesInvolvingPlayerId(CHALLENGE.challengee).filter(c => c.winner !== null && c.winner !== CHALLENGE.challengee).length;


describe('fetching player challenge records', function() {

    let mongoServer, requester, challengerToken, challengeeToken, outsiderToken;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => TestUtils.createToken(CHALLENGE.challenger)).then((token) => challengerToken = token)
            .then(() => TestUtils.createToken(CHALLENGE.challengee)).then((token) => challengeeToken = token)
            .then(() => TestUtils.createToken(TestUtils.getPlayers()[0]._id)).then((token) => outsiderToken = token);
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .get(`/api/challenge/player/record/${CHALLENGE.challenger}`)
            .then((res) => {
                expect(res).to.have.status(401);
                expect(res.body).to.be.empty;
            });
    });

    it('returns zeros for wins and losses when there are none', function() {
        return requester
            .get(`/api/challenge/player/record/000000000000000000000014`)
            .set('Authorization', `JWT ${challengerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challenger wins').to.equal(0);
                expect(res.body.message.losses, 'challenger losses').to.equal(0);
            });
    });

    it('returns records for deactivated players', function() {
        const DEACTIVATED_PLAYER = TestUtils.getPlayers().find(p => p.active === false);
        return requester
            .get(`/api/challenge/player/record/${DEACTIVATED_PLAYER._id}`)
            .set('Authorization', `JWT ${challengerToken}`)
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
            .get(`/api/challenge/player/record/${CHALLENGE.challenger}`)
            .set('Authorization', `JWT ${challengerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challenger wins').to.equal(RESOLVED_CHALLENGE_CHALLENGER_WINS);
                expect(res.body.message.losses, 'challenger losses').to.equal(RESOLVED_CHALLENGE_CHALLENGER_LOSSES);
            });
    });

    it('fetches score for challenger as challengee', function() {
        return requester
            .get(`/api/challenge/player/record/${CHALLENGE.challenger}`)
            .set('Authorization', `JWT ${challengeeToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challenger wins').to.equal(RESOLVED_CHALLENGE_CHALLENGER_WINS);
                expect(res.body.message.losses, 'challenger losses').to.equal(RESOLVED_CHALLENGE_CHALLENGER_LOSSES);
            });
    });

    it('fetches score for challenger as non-challenger', function() {
        return requester
            .get(`/api/challenge/player/record/${CHALLENGE.challenger}`)
            .set('Authorization', `JWT ${outsiderToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challenger wins').to.equal(RESOLVED_CHALLENGE_CHALLENGER_WINS);
                expect(res.body.message.losses, 'challenger losses').to.equal(RESOLVED_CHALLENGE_CHALLENGER_LOSSES);
            });
    });

    it('fetches score for challengee as challenger', function() {
        return requester
            .get(`/api/challenge/player/record/${CHALLENGE.challengee}`)
            .set('Authorization', `JWT ${challengerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challengee wins').to.equal(RESOLVED_CHALLENGE_CHALLENGEE_WINS);
                expect(res.body.message.losses, 'challengee losses').to.equal(RESOLVED_CHALLENGE_CHALLENGEE_LOSSES);
            });
    });

    it('fetches score for challengee as challengee', function() {
        return requester
            .get(`/api/challenge/player/record/${CHALLENGE.challengee}`)
            .set('Authorization', `JWT ${challengeeToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challengee wins').to.equal(RESOLVED_CHALLENGE_CHALLENGEE_WINS);
                expect(res.body.message.losses, 'challengee losses').to.equal(RESOLVED_CHALLENGE_CHALLENGEE_LOSSES);
            });
    });

    it('fetches score for challengee as non-challenger', function() {
        return requester
            .get(`/api/challenge/player/record/${CHALLENGE.challengee}`)
            .set('Authorization', `JWT ${outsiderToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('wins', 'losses');
                expect(res.body.message.wins, 'challengee wins').to.equal(RESOLVED_CHALLENGE_CHALLENGEE_WINS);
                expect(res.body.message.losses, 'challengee losses').to.equal(RESOLVED_CHALLENGE_CHALLENGEE_LOSSES);
            });
    });

});
