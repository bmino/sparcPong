const mongoose = require('mongoose');
require('../models'); // Register schemas
const Authorization = mongoose.model('Authorization');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const AuthService = require("../services/AuthService");
const TestUtils = require('./TestUtils');

const JSON_PAYLOAD = {
    "oldPassword": "Aaron",
    "newPassword": "Aaron2"
};

describe('password change', function() {

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
            .post('/api/player/change/password')
            .send(JSON_PAYLOAD)
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectUnchangedPassword);
    });

    it('completes successfully', function() {
        return requester
            .post('/api/player/change/password')
            .send(JSON_PAYLOAD)
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(() => Authorization.findOne({user: TestUtils.getPlayers()[0]._id}).exec())
            .then((authorization) => expect(authorization.isPasswordEqualTo(JSON_PAYLOAD.newPassword), 'password match').to.be.true);
    });

    it('requires the correct current password', function() {
        return requester
            .post('/api/player/change/password')
            .send({ ...JSON_PAYLOAD, oldPassword: JSON_PAYLOAD.oldPassword + '_delta'})
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Incorrect current password');
            })
            .then(expectUnchangedPassword);
    });

    it('requires a long enough password', function() {
        const tooShortPassword = 'x'.repeat(Math.max(AuthService.PASSWORD_MIN_LENGTH -1, 0));

        return requester
            .post('/api/player/change/password')
            .send({ ...JSON_PAYLOAD, newPassword: tooShortPassword})
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('Password must be at least');
            })
            .then(expectUnchangedPassword);
    });

    it('requires a short enough password', function() {
        const tooLongPassword = 'x'.repeat(AuthService.PASSWORD_MAX_LENGTH + 1);

        return requester
            .post('/api/player/change/password')
            .send({ ...JSON_PAYLOAD, newPassword: tooLongPassword})
            .set('Authorization', `JWT ${token1}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('Password cannot be longer than');
            })
            .then(expectUnchangedPassword);
    });

    describe('required fields', function() {

        it('must provide oldPassword', function () {
            return requester
                .post('/api/player/change/password')
                .send({ ...JSON_PAYLOAD, oldPassword: undefined })
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Old password is required');
                })
                .then(expectUnchangedPassword);
        });

        it('must provide newPassword', function () {
            return requester
                .post('/api/player/change/password')
                .send({ ...JSON_PAYLOAD, newPassword: undefined })
                .set('Authorization', `JWT ${token1}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('New password is required');
                })
                .then(expectUnchangedPassword);
        });

    });

});


function expectUnchangedPassword() {
    return Authorization.findOne({user: TestUtils.getPlayers()[0]._id}).exec()
        .then((authorization) => expect(authorization.isPasswordEqualTo(JSON_PAYLOAD.newPassword), 'password match').to.be.false);
}