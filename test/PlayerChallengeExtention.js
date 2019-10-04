const mongoose = require('mongoose');
require('../models'); // Register schemas
const Challenge = mongoose.model('Challenge');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');

const RESOLVED_CHALLENGE = TestUtils.getPlayerChallenges().find(c => c.winner !== null && !c.createdAt);
const EXPIRED_CHALLENGE = TestUtils.getPlayerChallenges().find(c => c.winner === null && new Date(c.createdAt).getYear() < new Date().getYear());
const JSON_PAYLOAD = {
    challengeId: EXPIRED_CHALLENGE._id,
    hours: 1
};


describe('extend player challenges', function() {

    let mongoServer, requester, expiredChallengerToken, expiredChallengeeToken, outsiderToken, resolvedChallengerToken, resolvedChallengeeToken;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        expect(RESOLVED_CHALLENGE, 'resolved player challenge').not.to.be.undefined;
        expect(EXPIRED_CHALLENGE, 'expired player challenge').not.to.be.undefined;

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => TestUtils.createToken(EXPIRED_CHALLENGE.challenger)).then((token) => expiredChallengerToken = token)
            .then(() => TestUtils.createToken(EXPIRED_CHALLENGE.challengee)).then((token) => expiredChallengeeToken = token)
            .then(() => TestUtils.createToken(TestUtils.getPlayers()[0]._id)).then((token) => outsiderToken = token)
            .then(() => TestUtils.createToken(RESOLVED_CHALLENGE.challenger)).then((token) => resolvedChallengerToken = token)
            .then(() => TestUtils.createToken(RESOLVED_CHALLENGE.challengee)).then((token) => resolvedChallengeeToken = token);
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .post('/api/challenge/player/extend')
            .send(JSON_PAYLOAD)
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectNoChange);
    });

    it('can NOT extend a resolved challenge', function() {
        return requester
            .post('/api/challenge/player/extend')
            .send({ ...JSON_PAYLOAD, challengeId: RESOLVED_CHALLENGE._id })
            .set('Authorization', `JWT ${resolvedChallengerToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('This challenge has already been resolved');
            })
            .then(expectNoChange);
    });

    describe('after expiration', function() {

        it('can NOT be extended by unrelated player after expiration', function() {
            return requester
                .post('/api/challenge/player/extend')
                .send(JSON_PAYLOAD)
                .set('Authorization', `JWT ${outsiderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Only the challenger can extend this challenge');
                })
                .then(expectNoChange);
        });

        it('can NOT be extended by challenger after expiration', function() {
            return requester
                .post('/api/challenge/player/extend')
                .send(JSON_PAYLOAD)
                .set('Authorization', `JWT ${expiredChallengerToken}`)
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.contain.key('message');
                    expect(res.body.message).to.equal('Challenge successfully extended.');
                })
                .then(expectNoChange);
        });

    });

    describe('before expiration', function() {

        it('can NOT be extended by unrelated player before expiration', function() {
            return Challenge.findByIdAndUpdate(EXPIRED_CHALLENGE._id, {createdAt: new Date()}, {timestamps: false}).exec()
                .then(() => {
                    return requester
                        .post('/api/challenge/player/extend')
                        .send(JSON_PAYLOAD)
                        .set('Authorization', `JWT ${outsiderToken}`)
                        .then((res) => {
                            expect(res).to.have.status(500);
                            expect(res.body).to.equal('Only the challenger can extend this challenge');
                        })
                        .then(expectNoChange);
                });
        });

        it('can NOT be extended by challengee before expiration', function() {
            return Challenge.findByIdAndUpdate(EXPIRED_CHALLENGE._id, {createdAt: new Date()}, {timestamps: false}).exec()
                .then(() => {
                    return requester
                        .post('/api/challenge/player/extend')
                        .send(JSON_PAYLOAD)
                        .set('Authorization', `JWT ${expiredChallengeeToken}`)
                        .then((res) => {
                            expect(res).to.have.status(500);
                            expect(res.body).to.equal('Only the challenger can extend this challenge');
                        })
                        .then(expectNoChange);
                });
        });

        it('can be extended by challenger before expiration', function() {
            return Challenge.findByIdAndUpdate(EXPIRED_CHALLENGE._id, {createdAt: new Date()}, {timestamps: false}).exec()
                .then(() => {
                    return requester
                        .post('/api/challenge/player/extend')
                        .send(JSON_PAYLOAD)
                        .set('Authorization', `JWT ${expiredChallengerToken}`)
                        .then((res) => {
                            expect(res).to.have.status(200);
                            expect(res.body).to.contain.key('message');
                            expect(res.body.message).to.equal('Challenge successfully extended.');
                        })
                        .then(expectChallengerExtension);
                });
        });

    });

    describe('required fields', function() {

        it('must provide challengeId', function() {
            return requester
                .post('/api/challenge/player/extend')
                .send({ ...JSON_PAYLOAD, challengeId: undefined })
                .set('Authorization', `JWT ${expiredChallengeeToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Challenge id is required');
                })
                .then(expectNoChange);
        });

        it('must provide hours', function() {
            return requester
                .post('/api/challenge/player/extend')
                .send({ ...JSON_PAYLOAD, hours: undefined })
                .set('Authorization', `JWT ${expiredChallengeeToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Hours is required');
                })
                .then(expectNoChange);
        });

    });

});

function expectChallengerExtension() {
    return Challenge.findById(EXPIRED_CHALLENGE._id).populate('challenger challengee').exec()
        .then((expiredChallenge) => {
            expect(expiredChallenge.createdAt, 'creation date').to.be.greaterThan(new Date(TestUtils.getPlayerChallengeByChallengeId(expiredChallenge._id).createdAt));
            expect(expiredChallenge.winner, 'winner').to.equal(TestUtils.getPlayerChallengeByChallengeId(expiredChallenge._id).winner);
            expect(expiredChallenge.challengerScore, 'challenger score').to.equal(TestUtils.getPlayerChallengeByChallengeId(expiredChallenge._id).challengerScore);
            expect(expiredChallenge.challengeeScore, 'challengee score').to.equal(TestUtils.getPlayerChallengeByChallengeId(expiredChallenge._id).challengeeScore);
            expect(expiredChallenge.challenger.rank, 'challenger rank').to.equal(TestUtils.getPlayerById(expiredChallenge.challenger._id).rank);
            expect(expiredChallenge.challengee.rank, 'challengee rank').to.equal(TestUtils.getPlayerById(expiredChallenge.challengee._id).rank);
        });
}

function expectNoChange() {
    return Promise.all([
        Challenge.findById(EXPIRED_CHALLENGE._id).populate('challenger challengee').exec(),
        Challenge.findById(EXPIRED_CHALLENGE._id).populate('challenger challengee').exec()
    ])
        .then(([expiredChallenge, resolvedChallenge]) => {
            expect(expiredChallenge.winner, 'winner').to.equal(TestUtils.getPlayerChallengeByChallengeId(expiredChallenge._id).winner);
            expect(expiredChallenge.challengerScore, 'challenger score').to.equal(TestUtils.getPlayerChallengeByChallengeId(expiredChallenge._id).challengerScore);
            expect(expiredChallenge.challengeeScore, 'challengee score').to.equal(TestUtils.getPlayerChallengeByChallengeId(expiredChallenge._id).challengeeScore);
            expect(expiredChallenge.challenger.rank, 'challenger rank').to.equal(TestUtils.getPlayerById(expiredChallenge.challenger._id).rank);
            expect(expiredChallenge.challengee.rank, 'challengee rank').to.equal(TestUtils.getPlayerById(expiredChallenge.challengee._id).rank);

            expect(resolvedChallenge.winner, 'winner').to.equal(TestUtils.getPlayerChallengeByChallengeId(resolvedChallenge._id).winner);
            expect(resolvedChallenge.challengerScore, 'challenger score').to.equal(TestUtils.getPlayerChallengeByChallengeId(resolvedChallenge._id).challengerScore);
            expect(resolvedChallenge.challengeeScore, 'challengee score').to.equal(TestUtils.getPlayerChallengeByChallengeId(resolvedChallenge._id).challengeeScore);
            expect(resolvedChallenge.challenger.rank, 'challenger rank').to.equal(TestUtils.getPlayerById(resolvedChallenge.challenger._id).rank);
            expect(resolvedChallenge.challengee.rank, 'challengee rank').to.equal(TestUtils.getPlayerById(resolvedChallenge.challengee._id).rank);
        });
}
