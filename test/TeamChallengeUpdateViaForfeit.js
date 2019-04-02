const mongoose = require('mongoose');
require('../models'); // Register schemas
const TeamChallenge = mongoose.model('TeamChallenge');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');

const RESOLVED_CHALLENGE = TestUtils.getTeamChallenges().find(c => c.winner !== null && !c.createdAt);
const EXPIRED_CHALLENGE = TestUtils.getTeamChallenges().find(c => c.winner === null && new Date(c.createdAt).getYear() < new Date().getYear());
const JSON_PAYLOAD = {
    challengeId: EXPIRED_CHALLENGE._id
};


describe('forfeit team challenges', function() {

    let mongoServer, requester, expiredChallengerLeaderToken, expiredChallengerPartnerToken, expiredChallengeeLeaderToken, expiredChallengeePartnerToken, resolvedChallengerLeaderToken, resolvedChallengerPartnerToken, resolvedChallengeeLeaderToken, resolvedChallengeePartnerToken, unrelatedPlayerToken;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        expect(RESOLVED_CHALLENGE, 'resolved team challenge').not.to.be.undefined;
        expect(EXPIRED_CHALLENGE, 'expired team challenge').not.to.be.undefined;

        const EXPIRED_CHALLENGER_TEAM = TestUtils.getTeamById(EXPIRED_CHALLENGE.challenger);
        const EXPIRED_CHALLENGEE_TEAM = TestUtils.getTeamById(EXPIRED_CHALLENGE.challengee);
        const RESOLVED_CHALLENGER_TEAM = TestUtils.getTeamById(RESOLVED_CHALLENGE.challenger);
        const RESOLVED_CHALLENGEE_TEAM = TestUtils.getTeamById(RESOLVED_CHALLENGE.challengee);
        const INVOLVED_PLAYER_IDS = [EXPIRED_CHALLENGER_TEAM.leader, EXPIRED_CHALLENGER_TEAM.partner, EXPIRED_CHALLENGEE_TEAM.leader, EXPIRED_CHALLENGEE_TEAM.partner, RESOLVED_CHALLENGER_TEAM.leader, RESOLVED_CHALLENGER_TEAM.partner, RESOLVED_CHALLENGEE_TEAM.leader, RESOLVED_CHALLENGEE_TEAM.partner];
        
        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => TestUtils.createToken(EXPIRED_CHALLENGER_TEAM.leader)).then((token) => expiredChallengerLeaderToken = token)
            .then(() => TestUtils.createToken(EXPIRED_CHALLENGER_TEAM.partner)).then((token) => expiredChallengerPartnerToken = token)
            .then(() => TestUtils.createToken(EXPIRED_CHALLENGEE_TEAM.leader)).then((token) => expiredChallengeeLeaderToken = token)
            .then(() => TestUtils.createToken(EXPIRED_CHALLENGEE_TEAM.partner)).then((token) => expiredChallengeePartnerToken = token)
            .then(() => TestUtils.createToken(RESOLVED_CHALLENGER_TEAM.leader)).then((token) => resolvedChallengerLeaderToken = token)
            .then(() => TestUtils.createToken(RESOLVED_CHALLENGER_TEAM.partner)).then((token) => resolvedChallengerPartnerToken = token)
            .then(() => TestUtils.createToken(RESOLVED_CHALLENGEE_TEAM.leader)).then((token) => resolvedChallengeeLeaderToken = token)
            .then(() => TestUtils.createToken(RESOLVED_CHALLENGEE_TEAM.partner)).then((token) => resolvedChallengeePartnerToken = token)
            .then(() => TestUtils.createToken(TestUtils.getTeams().filter(t => !INVOLVED_PLAYER_IDS.includes(t._id))[0]._id)).then((token) => unrelatedPlayerToken = token);
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .post('/api/challenge/team/forfeit')
            .send(JSON_PAYLOAD)
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectNoChange);
    });

    describe('resolved challenge', function() {

        it('challenger leader can NOT forfeit a resolved challenge', function() {
            return requester
                .post('/api/challenge/team/forfeit')
                .send({ ...JSON_PAYLOAD, challengeId: RESOLVED_CHALLENGE._id })
                .set('Authorization', `JWT ${resolvedChallengerLeaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                })
                .then(expectNoChange);
        });

        it('challenger partner can NOT forfeit a resolved challenge', function() {
            return requester
                .post('/api/challenge/team/forfeit')
                .send({ ...JSON_PAYLOAD, challengeId: RESOLVED_CHALLENGE._id })
                .set('Authorization', `JWT ${resolvedChallengerPartnerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                })
                .then(expectNoChange);
        });

        it('challengee leader can NOT forfeit a resolved challenge', function() {
            return requester
                .post('/api/challenge/team/forfeit')
                .send({ ...JSON_PAYLOAD, challengeId: RESOLVED_CHALLENGE._id })
                .set('Authorization', `JWT ${resolvedChallengeeLeaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('This challenge has already been resolved');
                })
                .then(expectNoChange);
        });

        it('challengee partner can NOT forfeit a resolved challenge', function() {
            return requester
                .post('/api/challenge/team/forfeit')
                .send({ ...JSON_PAYLOAD, challengeId: RESOLVED_CHALLENGE._id })
                .set('Authorization', `JWT ${resolvedChallengeePartnerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('This challenge has already been resolved');
                })
                .then(expectNoChange);
        });

    });

    describe('after expiration', function() {

        it('can NOT be forfeited by unrelated player after expiration', function() {
            return requester
                .post('/api/challenge/team/forfeit')
                .send(JSON_PAYLOAD)
                .set('Authorization', `JWT ${unrelatedPlayerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                })
                .then(expectNoChange);
        });

        it('can NOT be forfeited by challenger leader after expiration', function() {
            return requester
                .post('/api/challenge/team/forfeit')
                .send(JSON_PAYLOAD)
                .set('Authorization', `JWT ${expiredChallengerLeaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                })
                .then(expectNoChange);
        });

        it('can NOT be forfeited by challenger partner after expiration', function() {
            return requester
                .post('/api/challenge/team/forfeit')
                .send(JSON_PAYLOAD)
                .set('Authorization', `JWT ${expiredChallengerPartnerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                })
                .then(expectNoChange);
        });

        it('can be forfeited by challengee leader after expiration', function() {
            return requester
                .post('/api/challenge/team/forfeit')
                .send(JSON_PAYLOAD)
                .set('Authorization', `JWT ${expiredChallengeeLeaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.contain.keys('message');
                })
                .then(expectChallengerWin);
        });

        it('can be forfeited by challengee partner after expiration', function() {
            return requester
                .post('/api/challenge/team/forfeit')
                .send(JSON_PAYLOAD)
                .set('Authorization', `JWT ${expiredChallengeePartnerToken}`)
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.contain.keys('message');
                })
                .then(expectChallengerWin);
        });

    });

    describe('before expiration', function() {

        it('can NOT be forfeited by unrelated player before expiration', function() {
            return TeamChallenge.findByIdAndUpdate(EXPIRED_CHALLENGE._id, {createdAt: new Date()}, {timestamps: false}).exec()
                .then(() => {
                    return requester
                        .post('/api/challenge/team/forfeit')
                        .send(JSON_PAYLOAD)
                        .set('Authorization', `JWT ${unrelatedPlayerToken}`)
                        .then((res) => {
                            expect(res).to.have.status(500);
                            expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                        })
                        .then(expectNoChange);
                });
        });

        it('can NOT be forfeited by challenger leader before expiration', function() {
            return TeamChallenge.findByIdAndUpdate(EXPIRED_CHALLENGE._id, {createdAt: new Date()}, {timestamps: false}).exec()
                .then(() => {
                    return requester
                        .post('/api/challenge/team/forfeit')
                        .send(JSON_PAYLOAD)
                        .set('Authorization', `JWT ${expiredChallengerLeaderToken}`)
                        .then((res) => {
                            expect(res).to.have.status(500);
                            expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                        })
                        .then(expectNoChange);
                });
        });

        it('can NOT be forfeited by challenger partner before expiration', function() {
            return TeamChallenge.findByIdAndUpdate(EXPIRED_CHALLENGE._id, {createdAt: new Date()}, {timestamps: false}).exec()
                .then(() => {
                    return requester
                        .post('/api/challenge/team/forfeit')
                        .send(JSON_PAYLOAD)
                        .set('Authorization', `JWT ${expiredChallengerPartnerToken}`)
                        .then((res) => {
                            expect(res).to.have.status(500);
                            expect(res.body).to.equal('Only the challengee can forfeit this challenge');
                        })
                        .then(expectNoChange);
                });
        });

        it('can be forfeited by challengee leader before expiration', function() {
            return TeamChallenge.findByIdAndUpdate(EXPIRED_CHALLENGE._id, {createdAt: new Date()}, {timestamps: false}).exec()
                .then(() => {
                    return requester
                        .post('/api/challenge/team/forfeit')
                        .send(JSON_PAYLOAD)
                        .set('Authorization', `JWT ${expiredChallengeeLeaderToken}`)
                        .then((res) => {
                            expect(res).to.have.status(200);
                            expect(res.body).to.contain.keys('message');
                        })
                        .then(expectChallengerWin);
                });
        });

        it('can be forfeited by challengee partner before expiration', function() {
            return TeamChallenge.findByIdAndUpdate(EXPIRED_CHALLENGE._id, {createdAt: new Date()}, {timestamps: false}).exec()
                .then(() => {
                    return requester
                        .post('/api/challenge/team/forfeit')
                        .send(JSON_PAYLOAD)
                        .set('Authorization', `JWT ${expiredChallengeePartnerToken}`)
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
                .post('/api/challenge/team/forfeit')
                .send({ ...JSON_PAYLOAD, challengeId: undefined })
                .set('Authorization', `JWT ${expiredChallengeeLeaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Challenge id is required');
                })
                .then(expectNoChange);
        });

    });

});

function expectChallengerWin() {
    return TeamChallenge.findById(EXPIRED_CHALLENGE._id).populate('challenger challengee').exec()
        .then((expiredChallenge) => {
            expect(expiredChallenge.winner.toString()).to.equal(expiredChallenge.challenger._id.toString());
            expect(expiredChallenge.challengerScore, 'challenger score').to.be.null;
            expect(expiredChallenge.challengeeScore, 'challengee score').to.be.null;
            expect(expiredChallenge.challenger.rank, 'challenger rank').to.equal(TestUtils.getTeamById(expiredChallenge.challengee._id).rank);
            expect(expiredChallenge.challengee.rank, 'challengee rank').to.equal(TestUtils.getTeamById(expiredChallenge.challenger._id).rank);
        });
}

function expectNoChange() {
    return TeamChallenge.findById(EXPIRED_CHALLENGE._id).populate('challenger challengee').exec()
        .then((expiredChallenge) => {
            expect(expiredChallenge.winner, 'winner').to.be.null;
            expect(expiredChallenge.challengerScore, 'challenger score').to.be.null;
            expect(expiredChallenge.challengeeScore, 'challengee score').to.be.null;
            expect(expiredChallenge.challenger.rank, 'challenger rank').to.equal(TestUtils.getTeamById(expiredChallenge.challenger._id).rank);
            expect(expiredChallenge.challengee.rank, 'challenger rank').to.equal(TestUtils.getTeamById(expiredChallenge.challengee._id).rank);
        });
}
