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
const AuthService = require('../services/AuthService');

const EXPIRED_AUTHORIZATION = TestUtils.getAuthorizations().find(a => a.reset.key !== null && a.reset.date && new Date(a.reset.date) < new Date());
const PENDING_AUTHORIZATION = TestUtils.getAuthorizations().find(a => a.reset.key !== null && a.reset.date === null);
const VALID_PASSWORD = 'password123';

describe('change password', function() {

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

    it('successfully updates the password on a pending reset', function() {
        return requester
            .post('/auth/password/reset/change')
            .send({ password: VALID_PASSWORD, resetKey: PENDING_AUTHORIZATION.reset.key})
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.key('message');
            })
            .then(expectPasswordToBeChanged);
    });

    it('does NOT update the password on an expired reset', function() {
        return requester
            .post('/auth/password/reset/change')
            .send({ password: VALID_PASSWORD, resetKey: EXPIRED_AUTHORIZATION.reset.key})
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('Passwords can only be reset within');
            })
            .then(expectPasswordNotToBeChanged);
    });

    it('requires a long enough password', function() {
        const tooShortPassword = 'x'.repeat(Math.max(AuthService.PASSWORD_MIN_LENGTH -1, 0));

        return requester
            .post('/auth/password/reset/change')
            .send({ password: tooShortPassword, resetKey: PENDING_AUTHORIZATION.reset.key })
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('Password must be at least');
            })
            .then(expectPasswordNotToBeChanged);
    });

    it('requires a long enough password after trimming', function() {
        const tooShortPassword = 'x'.repeat(Math.max(AuthService.PASSWORD_MIN_LENGTH - 2, 0)) + ' '.repeat(3);

        return requester
            .post('/auth/password/reset/change')
            .send({ password: tooShortPassword, resetKey: PENDING_AUTHORIZATION.reset.key })
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('Password must be at least');
            })
            .then(expectPasswordNotToBeChanged);
    });

    it('requires a short enough password', function() {
        const tooLongPassword = 'x'.repeat(AuthService.PASSWORD_MAX_LENGTH + 1);

        return requester
            .post('/auth/password/reset/change')
            .send({ password: tooLongPassword, resetKey: PENDING_AUTHORIZATION.reset.key })
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('Password cannot be longer than');
            })
            .then(expectPasswordNotToBeChanged);
    });

    it('fails gracefully with an invalid reset key', function() {
        return requester
            .post('/auth/password/reset/change')
            .send({ password: VALID_PASSWORD, resetKey: 'non_existent_key' })
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('Invalid password reset key');
            })
            .then(expectPasswordNotToBeChanged);
    });

    describe('required fields', function() {

        it('must provide password', function() {
            return requester
                .post('/auth/password/reset/change')
                .send({ password: undefined, resetKey: PENDING_AUTHORIZATION.reset.key })
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Password is required');
                })
                .then(expectPasswordNotToBeChanged);
        });

        it('must provide resetKey', function() {
            return requester
                .post('/auth/password/reset/change')
                .send({ password: VALID_PASSWORD, resetKey: undefined })
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Reset key is required');
                })
                .then(expectPasswordNotToBeChanged);
        });

    });

});

function expectPasswordToBeChanged() {
    return Promise.all([
        Authorization.findById(PENDING_AUTHORIZATION._id).exec(),
        Authorization.findById(EXPIRED_AUTHORIZATION._id).exec(),
    ])
        .then(([realPendingAuthorization, realExpiredAuthorization]) => {
            expect(realPendingAuthorization.password, 'current password').to.not.equal(PENDING_AUTHORIZATION.password);
            expect(realPendingAuthorization.reset.key, 'current key').to.be.null;
            expect(new Date(realPendingAuthorization.reset.date).getTime(), 'current date').to.be.at.least(new Date(PENDING_AUTHORIZATION.reset.date).getTime());

            expect(realExpiredAuthorization.password, 'current expired password').to.equal(EXPIRED_AUTHORIZATION.password);
            expect(realExpiredAuthorization.reset.key, 'current expired key').to.equal(EXPIRED_AUTHORIZATION.reset.key);
            expect(new Date(realExpiredAuthorization.reset.date).getTime(), 'current expired date').to.equal(new Date(EXPIRED_AUTHORIZATION.reset.date).getTime());
        });
}

function expectPasswordNotToBeChanged() {
    return Promise.all([
        Authorization.findById(PENDING_AUTHORIZATION._id).exec(),
        Authorization.findById(EXPIRED_AUTHORIZATION._id).exec(),
    ])
        .then(([realPendingAuthorization, realExpiredAuthorization]) => {
            expect(realPendingAuthorization.password, 'current password').to.equal(PENDING_AUTHORIZATION.password);
            expect(realPendingAuthorization.reset.key, 'current key').to.equal(PENDING_AUTHORIZATION.reset.key);
            expect(new Date(realPendingAuthorization.reset.date).getTime(), 'current date').to.equal(new Date(PENDING_AUTHORIZATION.reset.date).getTime());

            expect(realExpiredAuthorization.password, 'current expired password').to.equal(EXPIRED_AUTHORIZATION.password);
            expect(realExpiredAuthorization.reset.key, 'current expired key').to.equal(EXPIRED_AUTHORIZATION.reset.key);
            expect(new Date(realExpiredAuthorization.reset.date).getTime(), 'current expired date').to.equal(new Date(EXPIRED_AUTHORIZATION.reset.date).getTime());
        });
}