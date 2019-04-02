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

const AUTHORIZATION = TestUtils.getAuthorizations().find(a => a.reset.key === null && a.reset.date === null);
const JSON_PAYLOAD = {
    playerId: AUTHORIZATION.user
};

describe('enable password reset', function() {

    let mongoServer, requester;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()));
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    describe('required fields', function() {

        it('must provide playerId', function() {
            return requester
                .post('/auth/password/reset/enable')
                .send({ ...JSON_PAYLOAD, playerId: undefined })
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Player id is required');
                })
                .then(expectResetNotToBeEnabled);
        });

    });

});

function expectResetToBeEnabled() {
    return Authorization.findById(AUTHORIZATION._id).exec()
        .then((realAuthorization) => {
            expect(realAuthorization.password, 'current password').to.equal(AUTHORIZATION.password);
            expect(realAuthorization.reset.key, 'current key').to.not.equal(AUTHORIZATION.reset.key).and.to.not.be.null;
            expect(realAuthorization.reset.date, 'current date').to.be.greaterThan(AUTHORIZATION.reset.date).and.to.not.be.null;
        });
}

function expectResetNotToBeEnabled() {
    return Authorization.findById(AUTHORIZATION._id).exec()
        .then((realAuthorization) => {
            expect(realAuthorization.password, 'current password').to.equal(AUTHORIZATION.password);
            expect(realAuthorization.reset.key, 'current key').to.equal(AUTHORIZATION.reset.key);
            expect(realAuthorization.reset.date, 'current date').to.equal(AUTHORIZATION.reset.date);
        });
}