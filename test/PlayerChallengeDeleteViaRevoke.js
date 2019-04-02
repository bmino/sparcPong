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

const UNRESOLVED_CHALLENGE = TestUtils.getPlayerChallenges().find(c => c.winner === null);


describe('revoking player challenges', function() {

    let mongoServer, requester, challengerToken, challengeeToken, outsiderToken;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        expect(UNRESOLVED_CHALLENGE, 'unresolved player challenge').not.to.be.undefined;

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => TestUtils.createToken(UNRESOLVED_CHALLENGE.challenger)).then((token) => challengerToken = token)
            .then(() => TestUtils.createToken(UNRESOLVED_CHALLENGE.challengee)).then((token) => challengeeToken = token)
            .then(() => TestUtils.createToken(TestUtils.getPlayers()[0]._id)).then((token) => outsiderToken = token);
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .delete('/api/challenge/player/revoke')
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectZeroLessChallenges);
    });

    it('can be revoked by challenger', function() {
        return requester
            .delete('/api/challenge/player/revoke')
            .send({ challengeId: UNRESOLVED_CHALLENGE._id })
            .set('Authorization', `JWT ${challengerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectOneLessChallenge);
    });

    it('can NOT be revoked by challengee', function() {
        return requester
            .delete('/api/challenge/player/revoke')
            .send({ challengeId: UNRESOLVED_CHALLENGE._id })
            .set('Authorization', `JWT ${challengeeToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Only the challenger can revoke this challenge');
            })
            .then(expectZeroLessChallenges);
    });

    it('can NOT be revoked by unrelated player', function() {
        return requester
            .delete('/api/challenge/player/revoke')
            .send({ challengeId: UNRESOLVED_CHALLENGE._id })
            .set('Authorization', `JWT ${outsiderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Only the challenger can revoke this challenge');
            })
            .then(expectZeroLessChallenges);
    });

    it('non-existent challenge id will fail gracefully', function() {
        return requester
            .delete('/api/challenge/player/revoke')
            .send({ challengeId: "F00000000000000000000000" })
            .set('Authorization', `JWT ${challengerToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Invalid challenge id');
            })
            .then(expectZeroLessChallenges);
    });

    describe('required fields', function() {

        it('must provide challengeId', function() {
            return requester
                .delete('/api/challenge/player/revoke')
                .send({ challengeId: undefined })
                .set('Authorization', `JWT ${challengerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Challenge id is required');
                })
                .then(expectZeroLessChallenges);
        });

    });

});

function expectOneLessChallenge() {
    return Challenge.countDocuments().exec()
        .then((challengeCount) => expect(challengeCount, 'challenge count').to.equal(TestUtils.getPlayerChallenges().length - 1));
}

function expectZeroLessChallenges() {
    return Challenge.countDocuments().exec()
        .then((challengeCount) => expect(challengeCount, 'challenge count').to.equal(TestUtils.getPlayerChallenges().length));
}