const mongoose = require('mongoose');
require('../models'); // Register schemas
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');


describe('player lookup by id', function() {

    let mongoServer, requester;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .get(`/api/player/fetch/${TestUtils.getPlayers()[0]._id}`)
            .then((res) => {
                expect(res).to.have.status(401);
                expect(res.body).to.be.empty;
            });
    });

    it('completes successfully for an active player', function() {
        let token1;
        const ACTIVE_PLAYER = TestUtils.getPlayers().find(p => p.active === true);
        expect(ACTIVE_PLAYER, 'Test data did not include an active player').to.not.be.undefined;

        return TestUtils.createToken(ACTIVE_PLAYER._id)
            .then((token) => token1 = token)
            .then(() => {
                return requester
                    .get(`/api/player/fetch/${ACTIVE_PLAYER._id}`)
                    .set('Authorization', `JWT ${token1}`)
                    .then((res) => {
                        expect(res).to.have.status(200);
                        expect(res.body).to.contain.keys('message');
                        expect(res.body.message).to.be.an('object');
                        expect(res.body.message).to.deep.equal(ACTIVE_PLAYER);
                    });
            });
    });

    it('completes successfully for a deactivated player', function() {
        let token1;
        const DEACTIVATED_PLAYER = TestUtils.getPlayers().find(p => p.active === false);
        expect(DEACTIVATED_PLAYER, 'Test data did not include a deactivated player').to.not.be.undefined;

        return TestUtils.createToken(DEACTIVATED_PLAYER._id)
            .then((token) => token1 = token)
            .then(() => {
                return requester
                    .get(`/api/player/fetch/${DEACTIVATED_PLAYER._id}`)
                    .set('Authorization', `JWT ${token1}`)
                    .then((res) => {
                        expect(res).to.have.status(200);
                        expect(res.body).to.contain.keys('message');
                        expect(res.body.message).to.be.an('object');
                        expect(res.body.message).to.deep.equal(DEACTIVATED_PLAYER);
                    });
            });
    });

    it('cannot provide a non-existent playerId', function() {
        let token1;

        return TestUtils.createToken(TestUtils.getPlayers()[0]._id)
            .then((token) => token1 = token)
            .then(() => {
                return requester
                    .get('/api/player/fetch/F00000000000000000000000')
                    .set('Authorization', `JWT ${token1}`)
                    .then((res) => {
                        expect(res).to.have.status(500);
                        expect(res.body).to.equal('No player was found for that id');
                    });
            });
    });

});
