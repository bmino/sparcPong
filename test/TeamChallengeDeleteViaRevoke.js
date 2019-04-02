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

const UNRESOLVED_CHALLENGE = TestUtils.getTeamChallenges().find(c => c.winner === null);
const RESOLVED_CHALLENGE = TestUtils.getTeamChallenges().find(c => c.winner !== null);


describe('revoking team challenges', function() {

    let mongoServer, requester, challengerLeaderToken, challengerPartnerToken, challengeeLeaderToken, challengeePartnerToken, unrelatedPlayerToken;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        expect(UNRESOLVED_CHALLENGE, 'unresolved team challenge').not.to.be.undefined;

        console.log(UNRESOLVED_CHALLENGE);
        console.log(TestUtils.getTeamById(UNRESOLVED_CHALLENGE.challenger));

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => TestUtils.createToken(TestUtils.getTeamById(UNRESOLVED_CHALLENGE.challenger).leader)).then((token) => challengerLeaderToken = token)
            .then(() => TestUtils.createToken(TestUtils.getTeamById(UNRESOLVED_CHALLENGE.challenger).partner)).then((token) => challengerPartnerToken = token)
            .then(() => TestUtils.createToken(TestUtils.getTeamById(UNRESOLVED_CHALLENGE.challengee).leader)).then((token) => challengeeLeaderToken = token)
            .then(() => TestUtils.createToken(TestUtils.getTeamById(UNRESOLVED_CHALLENGE.challengee).partner)).then((token) => challengeePartnerToken = token)
            .then(() => TestUtils.createToken(TestUtils.getTeamById(RESOLVED_CHALLENGE.challenger).leader)).then((token) => unrelatedPlayerToken = token);
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .delete('/api/challenge/team/revoke')
            .send({ challengeId: UNRESOLVED_CHALLENGE._id })
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectZeroLessChallenges);
    });

    it('can NOT be revoked by unrelated leader', function() {
        return requester
            .delete('/api/challenge/team/revoke')
            .send({ challengeId: UNRESOLVED_CHALLENGE._id })
            .set('Authorization', `JWT ${unrelatedPlayerToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Only the challenger can revoke this challenge');
            })
            .then(expectZeroLessChallenges);
    });

    it('can be revoked by challenger leader', function() {
        return requester
            .delete('/api/challenge/team/revoke')
            .send({ challengeId: UNRESOLVED_CHALLENGE._id })
            .set('Authorization', `JWT ${challengerLeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectOneLessChallenge);
    });

    it('can be revoked by challenger partner', function() {
        return requester
            .delete('/api/challenge/team/revoke')
            .send({ challengeId: UNRESOLVED_CHALLENGE._id })
            .set('Authorization', `JWT ${challengerPartnerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectOneLessChallenge);
    });

    it('can NOT be revoked by challengee leader', function() {
        return requester
            .delete('/api/challenge/team/revoke')
            .send({ challengeId: UNRESOLVED_CHALLENGE._id })
            .set('Authorization', `JWT ${challengeeLeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Only the challenger can revoke this challenge');
            })
            .then(expectZeroLessChallenges);
    });

    it('can NOT be revoked by challengee partner', function() {
        return requester
            .delete('/api/challenge/team/revoke')
            .send({ challengeId: UNRESOLVED_CHALLENGE._id })
            .set('Authorization', `JWT ${challengeePartnerToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Only the challenger can revoke this challenge');
            })
            .then(expectZeroLessChallenges);
    });

    it('non-existent challenge id will fail gracefully', function() {
        return requester
            .delete('/api/challenge/team/revoke')
            .send({ challengeId: "F00000000000000000000000" })
            .set('Authorization', `JWT ${challengerLeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Invalid challenge id');
            })
            .then(expectZeroLessChallenges);
    });

    describe('required fields', function() {

        it('must provide challengeId', function() {
            return requester
                .delete('/api/challenge/team/revoke')
                .send({ challengeId: undefined })
                .set('Authorization', `JWT ${challengerLeaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Challenge id is required');
                })
                .then(expectZeroLessChallenges);
        });

    });

});


function expectOneLessChallenge() {
    return TeamChallenge.countDocuments().exec()
        .then((challengeCount) => expect(challengeCount, 'challenge count').to.equal(TestUtils.getTeamChallenges().length - 1));
}

function expectZeroLessChallenges() {
    return TeamChallenge.countDocuments().exec()
        .then((challengeCount) => expect(challengeCount, 'challenge count').to.equal(TestUtils.getTeamChallenges().length));
}