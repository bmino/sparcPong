const mongoose = require('mongoose');
require('../models'); // Register schemas
const Player = mongoose.model('Player');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const NameService = require('../services/NameService');
const TestUtils = require('./TestUtils');

const JSON_PAYLOAD = {
    "newUsername": "new_user"
};

describe('player username change', function() {

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
            .post('/api/player/change/username')
            .send(JSON_PAYLOAD)
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectUnchangedUsername);
    });

    it('completes successfully', function() {
        return requester
            .post('/api/player/change/username')
            .send(JSON_PAYLOAD)
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(() => Player.findById(TestUtils.getPlayers()[0]._id))
            .then((player) => {
                expect(player.username, 'player username').to.equal(JSON_PAYLOAD.newUsername);
            });
    });

    describe('valid username', function() {

        it('must be unique', function() {
            return requester
                .post('/api/player/change/username')
                .send({ ...JSON_PAYLOAD, newUsername: TestUtils.getPlayers()[0].username })
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Player username already exists');
                })
                .then(expectUnchangedUsername);
        });

        it('must be a string', function() {
            return requester
                .post('/api/player/change/username')
                .send({ ...JSON_PAYLOAD, newUsername: 123456789 })
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Invalid username data type');
                })
                .then(expectUnchangedUsername);
        });

        it('cannot have special characters', function() {
            return requester
                .post('/api/player/change/username')
                .send({ ...JSON_PAYLOAD, newUsername: 'I@MSPEC!@L' })
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Username can only include letters, numbers, underscores, and spaces');
                })
                .then(expectUnchangedUsername);
        });

        it('cannot have concurrent spaces', function() {
            return requester
                .post('/api/player/change/username')
                .send({ ...JSON_PAYLOAD, newUsername: 'FIRST  SECOND' })
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Username cannot have concurrent spaces');
                })
                .then(expectUnchangedUsername);
        });

        it('cannot have concurrent underscores', function() {
            return requester
                .post('/api/player/change/username')
                .send({ ...JSON_PAYLOAD, newUsername: 'FIRST__SECOND' })
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Username cannot have concurrent underscores');
                })
                .then(expectUnchangedUsername);
        });

        it('must be long enough', function() {
            const tooShortUsername = 'x'.repeat(Math.max(NameService.USERNAME_LENGTH_MIN - 1, 0));

            return requester
                .post('/api/player/change/username')
                .send({ ...JSON_PAYLOAD, newUsername: tooShortUsername})
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.contain('Username length must be between').and.to.contain('characters');
                })
                .then(expectUnchangedUsername);
        });

        it('must be short enough', function() {
            const tooLongUsername = 'x'.repeat(NameService.USERNAME_LENGTH_MAX + 1);

            return requester
                .post('/api/player/change/username')
                .send({ ...JSON_PAYLOAD, newUsername: tooLongUsername})
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.contain('Username length must be between').and.to.contain('characters');
                })
                .then(expectUnchangedUsername);
        });

    });

    describe('required fields', function() {

        it('must provide newUsername', function () {
            return requester
                .post('/api/player/change/username')
                .send({ ...JSON_PAYLOAD, newUsername: undefined })
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('New username is required');
                })
                .then(expectUnchangedUsername);
        });

    });

});


function expectUnchangedUsername() {
    return Player.findById(TestUtils.getPlayers()[0]._id)
        .then((player) => expect(player.username, 'player username').to.not.equal(JSON_PAYLOAD.newUsername));
}