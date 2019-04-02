const mongoose = require('mongoose');
require('../models'); // Register schemas
const Player = mongoose.model('Player');
const Challenge = mongoose.model('Challenge');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');


describe('issuing player challenges', function() {

    let mongoServer, requester, rank3Token, rank4Token, rank6Token;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => TestUtils.createToken(TestUtils.getPlayerByRank(3)._id)).then((token) => rank3Token = token)
            .then(() => TestUtils.createToken(TestUtils.getPlayerByRank(4)._id)).then((token) => rank4Token = token)
            .then(() => TestUtils.createToken(TestUtils.getPlayerByRank(6)._id)).then((token) => rank6Token = token);
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .post('/api/challenge/player')
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectZeroNewChallenges);
    });

    it('can challenge a player within the same tier', function() {
        return requester
            .post('/api/challenge/player')
            .send({ challengeeId: "000000000000000000000005" })
            .set('Authorization', `JWT ${rank6Token}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectOneNewChallenge);
    });

    it('can challenge a player one tier up', function() {
        return requester
            .post('/api/challenge/player')
            .send({ challengeeId: "000000000000000000000002" })
            .set('Authorization', `JWT ${rank6Token}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectOneNewChallenge);
    });

    it('can NOT challenge a lower ranked player', function() {
        return requester
            .post('/api/challenge/player')
            .send({ challengeeId: "000000000000000000000007" })
            .set('Authorization', `JWT ${rank6Token}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Cannot challenger an opponent below your rank');
            })
            .then(expectZeroNewChallenges);
    });

    it('can NOT challenge a player who has an outgoing challenge', function() {
        return requester
            .post('/api/challenge/player')
            .send({ challengeeId: "000000000000000000000004" })
            .set('Authorization', `JWT ${rank6Token}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('cannot have more than 1 outgoing challenges');
            })
            .then(expectZeroNewChallenges);
    });

    it('can NOT challenge a player who has an incoming challenge', function() {
        return requester
            .post('/api/challenge/player')
            .send({ challengeeId: "000000000000000000000003" })
            .set('Authorization', `JWT ${rank6Token}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('cannot have more than 1 incoming challenges');
            })
            .then(expectZeroNewChallenges);
    });

    it('can NOT challenge when already having an outgoing challenge', function() {
        return requester
            .post('/api/challenge/player')
            .send({ challengeeId: "000000000000000000000002" })
            .set('Authorization', `JWT ${rank4Token}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('cannot have more than 1 outgoing challenges');
            })
            .then(expectZeroNewChallenges);
    });

    it('can NOT challenge when already having an incoming challenge', function() {
        return requester
            .post('/api/challenge/player')
            .send({ challengeeId: "000000000000000000000002" })
            .set('Authorization', `JWT ${rank3Token}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('cannot have more than 1 incoming challenges');
            })
            .then(expectZeroNewChallenges);
    });

    it('can NOT challenge yourself', function() {
        return requester
            .post('/api/challenge/player')
            .send({ challengeeId: "000000000000000000000006" })
            .set('Authorization', `JWT ${rank6Token}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('Players cannot challenge themselves');
            })
            .then(expectZeroNewChallenges);
    });

    it('can NOT challenge an inactive player', function() {
        const INACTIVE_PLAYER = TestUtils.getPlayers().find(p => p.active === false);

        return requester
            .post('/api/challenge/player')
            .send({ challengeeId: INACTIVE_PLAYER._id })
            .set('Authorization', `JWT ${rank6Token}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('Both players must have active accounts');
            })
            .then(expectZeroNewChallenges);
    });

    it('can NOT challenge after being deactivated', function() {
        return Player.findOneAndUpdate({ _id: "000000000000000000000006" }, { active: false }).exec()
            .then(() => {
                return requester
                    .post('/api/challenge/player')
                    .send({ challengeeId: "000000000000000000000005" })
                    .set('Authorization', `JWT ${rank6Token}`)
                    .then((res) => {
                        expect(res).to.have.status(500);
                        expect(res.body).to.contain('Both players must have active accounts');
                    })
                    .then(expectZeroNewChallenges);
            });
    });

    describe('required fields', function() {

        it('must provide challengeeId', function() {
            return requester
                .post('/api/challenge/player')
                .send({ challengeeId: undefined })
                .set('Authorization', `JWT ${rank6Token}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Challengee id is required');
                })
                .then(expectZeroNewChallenges);
        });

    });

});

function expectOneNewChallenge() {
    return Challenge.countDocuments().exec()
        .then((challengeCount) => expect(challengeCount, 'challenge count').to.equal(TestUtils.getPlayerChallenges().length + 1));
}

function expectZeroNewChallenges() {
    return Challenge.countDocuments().exec()
        .then((challengeCount) => expect(challengeCount, 'challenge count').to.equal(TestUtils.getPlayerChallenges().length));
}