const mongoose = require('mongoose');
require('../models'); // Register schemas
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');

let UNRESOLVED_CHALLENGES = TestUtils.getPlayerChallenges().filter(c => c.winner === null);
const RESOLVED_CHALLENGES = TestUtils.getPlayerChallenges().filter(c => c.winner !== null);

describe('fetching player challenges', function() {

    let mongoServer, requester, playerToken;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        expect(UNRESOLVED_CHALLENGES, 'unresolved player challenges').to.have.length.greaterThan(0);
        expect(RESOLVED_CHALLENGES, 'resolved player challenges').to.have.length.greaterThan(0);

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => TestUtils.createToken(TestUtils.getPlayerByRank(1)._id)).then((token) => playerToken = token);
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .get(`/api/challenge/player/${UNRESOLVED_CHALLENGES[0].challenger}`)
            .then((res) => {
                expect(res).to.have.status(401);
                expect(res.body).to.be.empty;
            });
    });

    it('fetches all outgoing challenges', function() {
        const PLAYER_ID = UNRESOLVED_CHALLENGES[0].challenger;
        return requester
            .get(`/api/challenge/player/${PLAYER_ID}`)
            .set('Authorization', `JWT ${playerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('outgoing');
                expect(res.body.message.outgoing.map(c => c._id), 'outgoing challenge ids').to.contain(...getUnresolvedByPlayerId(PLAYER_ID));
            });
    });

    it('fetches all incoming challenges', function() {
        const PLAYER_ID = UNRESOLVED_CHALLENGES[0].challengee;
        return requester
            .get(`/api/challenge/player/${PLAYER_ID}`)
            .set('Authorization', `JWT ${playerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('incoming');
                expect(res.body.message.incoming.map(c => c._id), 'incoming challenge ids').to.contain(...getUnresolvedByPlayerId(PLAYER_ID));
            });
    });

    it('fetches all resolved challenges', function() {
        const PLAYER_ID = RESOLVED_CHALLENGES[0].challenger;
        return requester
            .get(`/api/challenge/player/${PLAYER_ID}`)
            .set('Authorization', `JWT ${playerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message).to.contain.keys('resolved');
                expect(res.body.message.resolved.map(c => c._id), 'resolved challenge ids').to.contain(...getResolvedByPlayerId(PLAYER_ID));
            });
    });

});


function getUnresolvedByPlayerId(playerId) {
    return UNRESOLVED_CHALLENGES.filter(c => c.challenger === playerId || c.challengee === playerId).map(c => c._id);
}

function getResolvedByPlayerId(playerId) {
    return RESOLVED_CHALLENGES.filter(c => c.challenger === playerId || c.challengee === playerId).map(c => c._id);
}