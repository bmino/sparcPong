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


describe('resolve player challenges', function() {

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
            .post('/api/challenge/player/resolve')
            .send({
                challengeId: UNRESOLVED_CHALLENGE._id,
                challengerScore: 2,
                challengeeScore: 0
            })
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectNoChange);
    });

    it('can NOT be resolved by unrelated player', function() {
        return requester
            .post('/api/challenge/player/resolve')
            .send({
                challengeId: UNRESOLVED_CHALLENGE._id,
                challengerScore: 2,
                challengeeScore: 0
            })
            .set('Authorization', `JWT ${outsiderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Only an involved player can resolve this challenge');
            })
            .then(expectNoChange);
    });

    it('can be resolved by challenger who wins', function() {
        return requester
            .post('/api/challenge/player/resolve')
            .send({
                challengeId: UNRESOLVED_CHALLENGE._id,
                challengerScore: 2,
                challengeeScore: 0
            })
            .set('Authorization', `JWT ${challengerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectChallengerWin);
    });

    it('can be resolved by challenger who loses', function() {
        return requester
            .post('/api/challenge/player/resolve')
            .send({
                challengeId: UNRESOLVED_CHALLENGE._id,
                challengerScore: 0,
                challengeeScore: 2
            })
            .set('Authorization', `JWT ${challengerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectChallengerLoss);
    });

    it('can be resolved by challengee who wins', function() {
        return requester
            .post('/api/challenge/player/resolve')
            .send({
                challengeId: UNRESOLVED_CHALLENGE._id,
                challengerScore: 0,
                challengeeScore: 2
            })
            .set('Authorization', `JWT ${challengeeToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectChallengerLoss);
    });

    it('can be resolved by challengee who loses', function() {
        return requester
            .post('/api/challenge/player/resolve')
            .send({
                challengeId: UNRESOLVED_CHALLENGE._id,
                challengerScore: 2,
                challengeeScore: 0
            })
            .set('Authorization', `JWT ${challengeeToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectChallengerWin);
    });

    it('can NOT be resolved by challenger once expired', function() {
        return Challenge.findByIdAndUpdate(UNRESOLVED_CHALLENGE._id, {createdAt: new Date("2000-12-25")}, {timestamps: false}).exec()
            .then(() => {
                return requester
                    .post('/api/challenge/player/resolve')
                    .send({
                        challengeId: UNRESOLVED_CHALLENGE._id,
                        challengerScore: 2,
                        challengeeScore: 0
                    })
                    .set('Authorization', `JWT ${challengerToken}`)
                    .then((res) => {
                        expect(res).to.have.status(500);
                        expect(res.body).to.equal('This challenge has expired and must be forfeited');
                    })
                    .then(expectNoChange);
            });
    });

    it('can NOT be resolved by challengee once expired', function() {
        return Challenge.findByIdAndUpdate(UNRESOLVED_CHALLENGE._id, {createdAt: new Date("2000-12-25")}, {timestamps: false}).exec()
            .then(() => {
                return requester
                    .post('/api/challenge/player/resolve')
                    .send({
                        challengeId: UNRESOLVED_CHALLENGE._id,
                        challengerScore: 2,
                        challengeeScore: 0
                    })
                    .set('Authorization', `JWT ${challengeeToken}`)
                    .then((res) => {
                        expect(res).to.have.status(500);
                        expect(res.body).to.equal('This challenge has expired and must be forfeited');
                    })
                    .then(expectNoChange);
            });
    });

    describe('valid scores', function() {

        it('can NOT be resolved by challenger with a tie', function() {
            return requester
                .post('/api/challenge/player/resolve')
                .send({
                    challengeId: UNRESOLVED_CHALLENGE._id,
                    challengerScore: 2,
                    challengeeScore: 2
                })
                .set('Authorization', `JWT ${challengerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('The final score cannot be equal');
                })
                .then(expectNoChange);
        });

        it('can NOT be resolved by challengee with a tie', function() {
            return requester
                .post('/api/challenge/player/resolve')
                .send({
                    challengeId: UNRESOLVED_CHALLENGE._id,
                    challengerScore: 2,
                    challengeeScore: 2
                })
                .set('Authorization', `JWT ${challengeeToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('The final score cannot be equal');
                })
                .then(expectNoChange);
        });

        it('can NOT be resolved by a challenger with less than 2 games', function() {
            return requester
                .post('/api/challenge/player/resolve')
                .send({
                    challengeId: UNRESOLVED_CHALLENGE._id,
                    challengerScore: 1,
                    challengeeScore: 0
                })
                .set('Authorization', `JWT ${challengerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('A valid set consists of at least 2 games');
                })
                .then(expectNoChange);
        });

        it('can NOT be resolved by a challenger with more than 5 games', function() {
            return requester
                .post('/api/challenge/player/resolve')
                .send({
                    challengeId: UNRESOLVED_CHALLENGE._id,
                    challengerScore: 4,
                    challengeeScore: 2
                })
                .set('Authorization', `JWT ${challengerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('No more than 5 games should be played in a set');
                })
                .then(expectNoChange);
        });

        it('can NOT be resolved by a challenger with a negative score', function() {
            return requester
                .post('/api/challenge/player/resolve')
                .send({
                    challengeId: UNRESOLVED_CHALLENGE._id,
                    challengerScore: -1,
                    challengeeScore: 3
                })
                .set('Authorization', `JWT ${challengerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Both scores must be positive');
                })
                .then(expectNoChange);
        });

        it('can NOT be resolved by a challengee with a negative score', function() {
            return requester
                .post('/api/challenge/player/resolve')
                .send({
                    challengeId: UNRESOLVED_CHALLENGE._id,
                    challengerScore: 3,
                    challengeeScore: -1
                })
                .set('Authorization', `JWT ${challengeeToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Both scores must be positive');
                })
                .then(expectNoChange);
        });

        it('can NOT be resolved by a challenger with a decimal score', function() {
            return requester
                .post('/api/challenge/player/resolve')
                .send({
                    challengeId: UNRESOLVED_CHALLENGE._id,
                    challengerScore: 1.5,
                    challengeeScore: 1
                })
                .set('Authorization', `JWT ${challengerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Both scores must be integers');
                })
                .then(expectNoChange);
        });

        it('can NOT be resolved by a challengee with a decimal score', function() {
            return requester
                .post('/api/challenge/player/resolve')
                .send({
                    challengeId: UNRESOLVED_CHALLENGE._id,
                    challengerScore: 1,
                    challengeeScore: 1.5
                })
                .set('Authorization', `JWT ${challengeeToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Both scores must be integers');
                })
                .then(expectNoChange);
        });

    });

    describe('required fields', function() {

        it('must provide challengeId', function() {
            return requester
                .post('/api/challenge/player/resolve')
                .send({
                    challengeId: undefined,
                    challengerScore: 2,
                    challengeeScore: 0
                })
                .set('Authorization', `JWT ${challengerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Challenge id is required');
                })
                .then(expectNoChange);
        });

        it('must provide challengerScore', function() {
            return requester
                .post('/api/challenge/player/resolve')
                .send({
                    challengeId: UNRESOLVED_CHALLENGE._id,
                    challengerScore: undefined,
                    challengeeScore: 0
                })
                .set('Authorization', `JWT ${challengerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Challenger score is required');
                })
                .then(expectNoChange);
        });

        it('must provide challengeeScore', function() {
            return requester
                .post('/api/challenge/player/resolve')
                .send({
                    challengeId: UNRESOLVED_CHALLENGE._id,
                    challengerScore: 0,
                    challengeeScore: undefined
                })
                .set('Authorization', `JWT ${challengerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Challengee score is required');
                })
                .then(expectNoChange);
        });

    });

});

function expectChallengerWin() {
    return Challenge.findById(UNRESOLVED_CHALLENGE._id).populate('challenger challengee').exec()
        .then((challenge) => {
            expect(challenge.winner.toString(), 'winner').to.equal(challenge.challenger._id.toString());
            expect(challenge.challengerScore, 'challenger score').to.be.greaterThan(challenge.challengeeScore);
            expect(challenge.challenger.rank, 'challenger rank').to.equal(TestUtils.getPlayerById(challenge.challengee._id).rank);
            expect(challenge.challengee.rank, 'challengee rank').to.equal(TestUtils.getPlayerById(challenge.challenger._id).rank);
        });
}

function expectChallengerLoss() {
    return Challenge.findById(UNRESOLVED_CHALLENGE._id).populate('challenger challengee').exec()
        .then((challenge) => {
            expect(challenge.winner.toString(), 'winner').to.equal(challenge.challengee._id.toString());
            expect(challenge.challengeeScore, 'challengee score').to.be.greaterThan(challenge.challengerScore);
            expect(challenge.challenger.rank, 'challenger rank').to.equal(TestUtils.getPlayerById(challenge.challenger._id).rank);
            expect(challenge.challengee.rank, 'challengee score').to.equal(TestUtils.getPlayerById(challenge.challengee._id).rank);
        });
}

function expectNoChange() {
    return Challenge.findById(UNRESOLVED_CHALLENGE._id).populate('challenger challengee').exec()
        .then((challenge) => {
            expect(challenge.winner, 'winner').to.be.null;
            expect(challenge.challengerScore, 'challenger score').to.be.null;
            expect(challenge.challengeeScore, 'challengee score').to.be.null;
            expect(challenge.challenger.rank, 'challenger rank').to.equal(TestUtils.getPlayerById(challenge.challenger._id).rank);
            expect(challenge.challengee.rank, 'challengee rank').to.equal(TestUtils.getPlayerById(challenge.challengee._id).rank);
        });
}