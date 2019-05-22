const mongoose = require('mongoose');
require('../models'); // Register schemas
const Authorization = mongoose.model('Authorization');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');


describe('fetches login information', function() {

    let mongoServer, requester;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()));
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    it('only includes active players', function() {
        const ACTIVE_PLAYER_IDS = TestUtils.getPlayers().filter(p => p.active).map(p => p._id);
        return requester
            .get('/auth/logins')
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message.map(p => p._id), 'player ids').to.include.all.members(ACTIVE_PLAYER_IDS);
            });
    });

    it('does not include inactive players', function() {
        const INACTIVE_PLAYER_IDS = TestUtils.getPlayers().filter(p => !p.active).map(p => p._id);
        return requester
            .get('/auth/logins')
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                expect(res.body.message.map(p => p._id), 'player ids').not.to.include.any.members(INACTIVE_PLAYER_IDS);
            });
    });

    it('only includes username and id', function() {
        return requester
            .get('/auth/logins')
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
                res.body.message.forEach(user => {
                    expect(user).contain.all.keys('_id', 'username');
                    expect(user).not.to.contain.any.keys('firstName', 'lastName', 'email');
                });
            });
    });

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

});
