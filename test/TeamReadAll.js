const mongoose = require('mongoose');
require('../models'); // Register schemas
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');


describe('team listing', function() {

    let mongoServer, requester, token1;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => TestUtils.createToken(TestUtils.getPlayers()[0]._id))
            .then((token) => token1 = token);
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .get('/api/team')
            .then((res) => {
                expect(res).to.have.status(401);
                expect(res.body).to.be.empty;
            });
    });

    it('completes successfully', function() {
        return requester
            .get('/api/team')
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
                expect(res.body.message).to.be.an('array');
                expect(res.body.message).to.have.deep.members(TestUtils.getTeams());
            });
    });

    it('returns an empty list when no teams exist', function() {
        return TestUtils.wipeDatabase()
            .then(() => {
                return requester
                    .get('/api/team')
                    .set('Authorization', `JWT ${token1}`)
                    .then((res) => {
                        expect(res).to.have.status(200);
                        expect(res.body).to.contain.keys('message');
                        expect(res.body.message).to.be.an('array').that.is.empty;
                    });
            });
    });

});
