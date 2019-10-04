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
    challengeId: EXPIRED_CHALLENGE._id
};


describe('forfeit player challenges', function() {

    let mongoServer, requester, expiredChallengerToken, expiredChallengeeToken, outsiderToken, resolvedChallengeeToken;

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
            .post('/api/challenge/player/forfeit')
            .send(JSON_PAYLOAD)
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectNoChange);
    });

    it('can NOT forfeit a resolved challenge', function() {
        return requester
            .post('/api/challenge/player/forfeit')
            .send({ ...JSON_PAYLOAD, challengeId: RESOLVED_CHALLENGE._id })
            .set('Authorization', `JWT ${resolvedChallengeeToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('This challenge has already been resolved');
            })
            .then(expectNoChange);
    });

    describe('after expiration', function() {

        it('can NOT be forfeited by unrelated player after expiration', function() {
            return requester
                .post('/api/challenge/player/forfeit')
                .send(JSON_PAYLOAD)
                .set('Authorization', `JWT ${outsiderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                })
                .then(expectNoChange);
        });

        it('can NOT be forfeited by challenger after expiration', function() {
            return requester
                .post('/api/challenge/player/forfeit')
                .send(JSON_PAYLOAD)
                .set('Authorization', `JWT ${expiredChallengerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                })
                .then(expectNoChange);
        });

        it('can be forfeited by challengee after expiration', function() {
            return requester
                .post('/api/challenge/player/forfeit')
                .send(JSON_PAYLOAD)
                .set('Authorization', `JWT ${expiredChallengeeToken}`)
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.contain.keys('message');
                })
                .then(expectChallengerWin);
        });

    });

    describe('before expiration', function() {

        it('can NOT be forfeited by unrelated player before expiration', function() {
            return Challenge.findByIdAndUpdate(EXPIRED_CHALLENGE._id, {createdAt: new Date()}, {timestamps: false}).exec()
                .then(() => {
                    return requester
                        .post('/api/challenge/player/forfeit')
                        .send(JSON_PAYLOAD)
                        .set('Authorization', `JWT ${expiredChallengerToken}`)
                        .then((res) => {
                            expect(res).to.have.status(500);
                            expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                        })
                        .then(expectNoChange);
                });
        });

        it('can NOT be forfeited by challenger before expiration', function() {
            return Challenge.findByIdAndUpdate(EXPIRED_CHALLENGE._id, {createdAt: new Date()}, {timestamps: false}).exec()
                .then(() => {
                    return requester
                        .post('/api/challenge/player/forfeit')
                        .send(JSON_PAYLOAD)
                        .set('Authorization', `JWT ${expiredChallengerToken}`)
                        .then((res) => {
                            expect(res).to.have.status(500);
                            expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                        })
                        .then(expectNoChange);
                });
        });

        it('can be forfeited by challengee before expiration', function() {
            return Challenge.findByIdAndUpdate(EXPIRED_CHALLENGE._id, {createdAt: new Date()}, {timestamps: false}).exec()
                .then(() => {
                    return requester
                        .post('/api/challenge/player/forfeit')
                        .send(JSON_PAYLOAD)
                        .set('Authorization', `JWT ${expiredChallengeeToken}`)
                        .then((res) => {
                            expect(res).to.have.status(200);
                            expect(res.body).to.contain.keys('message');
                        })
                        .then(expectChallengerWin);
                });
        });

    });

    describe('required fields', function() {

        it('must provide challengeId', function() {
            return requester
                .post('/api/challenge/player/forfeit')
                .send({ ...JSON_PAYLOAD, challengeId: undefined })
                .set('Authorization', `JWT ${expiredChallengeeToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Challenge id is required');
                })
                .then(expectNoChange);
        });

    });

});

function expectChallengerWin() {
    return Challenge.findById(EXPIRED_CHALLENGE._id).populate('challenger challengee').exec()
        .then((expiredChallenge) => {
            expect(expiredChallenge.winner.toString()).to.equal(expiredChallenge.challenger._id.toString());
            expect(expiredChallenge.challengerScore, 'challenger score').to.be.null;
            expect(expiredChallenge.challengeeScore, 'challengee score').to.be.null;
            expect(expiredChallenge.challenger.rank, 'challenger rank').to.equal(TestUtils.getPlayerById(expiredChallenge.challengee._id).rank);
            expect(expiredChallenge.challengee.rank, 'challengee rank').to.equal(TestUtils.getPlayerById(expiredChallenge.challenger._id).rank);
        });
}

function expectNoChange() {
    return Challenge.findById(EXPIRED_CHALLENGE._id).populate('challenger challengee').exec()
        .then((expiredChallenge) => {
            expect(expiredChallenge.winner, 'winner').to.be.null;
            expect(expiredChallenge.challengerScore, 'challenger score').to.be.null;
            expect(expiredChallenge.challengeeScore, 'challengee score').to.be.null;
            expect(expiredChallenge.challenger.rank, 'challenger rank').to.equal(TestUtils.getPlayerById(expiredChallenge.challenger._id).rank);
            expect(expiredChallenge.challengee.rank, 'challengee rank').to.equal(TestUtils.getPlayerById(expiredChallenge.challengee._id).rank);
        });
}
