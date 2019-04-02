const mongoose = require('mongoose');
require('../models'); // Register schemas
const Player = mongoose.model('Player');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');


describe('email removal', function() {

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
            .post('/api/player/change/email/remove')
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectUnchangedEmail);
    });

    it('completes successfully', function() {
        return requester
            .post('/api/player/change/email/remove')
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(() => Player.findById(TestUtils.getPlayers()[0]._id))
            .then((player) => expect(player.email, 'player email').to.be.empty);
    });

});


function expectUnchangedEmail() {
    return Player.findById(TestUtils.getPlayers()[0]._id)
        .then((player) => {
            expect(player.email, 'player email').to.equal(TestUtils.getPlayers()[0].email);
        });
}