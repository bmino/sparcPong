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

const JSON_PAYLOAD = {
    "newEmail": "new.email@fake_test_email.net"
};

describe('email change', function() {

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
            .post('/api/player/change/email')
            .send(JSON_PAYLOAD)
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectUnchangedEmail);
    });

    it('completes successfully', function() {
        return requester
            .post('/api/player/change/email')
            .send(JSON_PAYLOAD)
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(() => Player.findById(TestUtils.getPlayers()[0]._id))
            .then((player) => expect(player.email, 'email was NOT updated').to.equal(JSON_PAYLOAD.newEmail));
    });

    it('must provide a unique email', function () {
        return requester
            .post('/api/player/change/email')
            .send({ ...JSON_PAYLOAD, newEmail: TestUtils.getPlayers()[1].email })
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Email already exists');
            })
            .then(expectUnchangedEmail);
    });

    it('cannot be longer than 50 characters', function () {
        return requester
            .post('/api/player/change/email')
            .send({ ...JSON_PAYLOAD, newEmail: 'x'.repeat(51) })
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Email length cannot exceed 50 characters');
            })
            .then(expectUnchangedEmail);
    });

    it('must contain one ampersand', function () {
        return requester
            .post('/api/player/change/email')
            .send({ ...JSON_PAYLOAD, newEmail: 'new.emailfake_test_email.net' })
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Email must contain one @ symbol');
            })
            .then(expectUnchangedEmail);
    });

    it('cannot contain spaces', function () {
        return requester
            .post('/api/player/change/email')
            .send({ ...JSON_PAYLOAD, newEmail: 'new.email @ fake test email.net' })
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Email cannot contain spaces');
            })
            .then(expectUnchangedEmail);
    });

    describe('required fields', function() {

        it('must provide newEmail', function () {
            return requester
                .post('/api/player/change/email')
                .send({ ...JSON_PAYLOAD, newEmail: undefined })
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('New email is required');
                })
                .then(expectUnchangedEmail);
        });

        it('cannot provide an empty email', function () {
            return requester
                .post('/api/player/change/email')
                .send({ ...JSON_PAYLOAD, newEmail: '' })
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('New email is required');
                })
                .then(expectUnchangedEmail);
        });

    });

});


function expectUnchangedEmail() {
    return Player.findById(TestUtils.getPlayers()[0]._id)
        .then((player) => expect(player.email, 'player email').to.equal(TestUtils.getPlayers()[0].email));
}