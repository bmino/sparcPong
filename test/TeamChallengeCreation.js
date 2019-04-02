const mongoose = require('mongoose');
require('../models'); // Register schemas
const Team = mongoose.model('Team');
const TeamChallenge = mongoose.model('TeamChallenge');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');


describe('issuing team challenges', function() {

    let mongoServer, requester, rank6LeaderToken, rank6PartnerToken, teamlessPlayerToken;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => TestUtils.createToken(TestUtils.getTeamByRank(6).leader)).then((token) => rank6LeaderToken = token)
            .then(() => TestUtils.createToken(TestUtils.getTeamByRank(6).partner)).then((token) => rank6PartnerToken = token)
            .then(() => TestUtils.createToken(TestUtils.getPlayers()[0]._id)).then((token) => teamlessPlayerToken = token);
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(1)._id })
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectZeroNewChallenges);
    });

    it('player without a team can NOT challenge a team', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(5)._id })
            .set('Authorization', `JWT ${teamlessPlayerToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Player must be a member of a team');
            })
            .then(expectZeroNewChallenges);
    });

    it('leader can NOT challenge a team with an invalid id', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: "F00000000000000000000000" })
            .set('Authorization', `JWT ${rank6LeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Specified challenge does not exist');
            })
            .then(expectZeroNewChallenges);
    });

    it('partner can NOT challenge a team with an invalid id', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: "F00000000000000000000000" })
            .set('Authorization', `JWT ${rank6PartnerToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Specified challenge does not exist');
            })
            .then(expectZeroNewChallenges);
    });


    it('leader can challenge a team within the same tier', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(5)._id })
            .set('Authorization', `JWT ${rank6LeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectOneNewChallenge);
    });

    it('partner can challenge a team within the same tier', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(5)._id })
            .set('Authorization', `JWT ${rank6PartnerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectOneNewChallenge);
    });

    it('leader can challenge a team within one tier up', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(3)._id })
            .set('Authorization', `JWT ${rank6LeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectOneNewChallenge);
    });

    it('partner can challenge a team within one tier up', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(3)._id })
            .set('Authorization', `JWT ${rank6PartnerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectOneNewChallenge);
    });

    it('leader can NOT challenge a team two tiers up', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(1)._id })
            .set('Authorization', `JWT ${rank6LeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Cannot challenge an opponent beyond 1 tier');
            })
            .then(expectZeroNewChallenges);
    });

    it('partner can NOT challenge a team two tiers up', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(1)._id })
            .set('Authorization', `JWT ${rank6PartnerToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Cannot challenge an opponent beyond 1 tier');
            })
            .then(expectZeroNewChallenges);
    });

    it('leader can NOT challenge their own team', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(6)._id })
            .set('Authorization', `JWT ${rank6LeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Teams can not challenge themselves');
            })
            .then(expectZeroNewChallenges);
    });

    it('partner can NOT challenge their own team', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(6)._id })
            .set('Authorization', `JWT ${rank6PartnerToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Teams can not challenge themselves');
            })
            .then(expectZeroNewChallenges);
    });

    it('leader can NOT challenge a lower rated team', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(7)._id })
            .set('Authorization', `JWT ${rank6LeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Cannot challenger an opponent below your rank');
            })
            .then(expectZeroNewChallenges);
    });

    it('partner can NOT challenge a lower rated team', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(7)._id })
            .set('Authorization', `JWT ${rank6PartnerToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Cannot challenger an opponent below your rank');
            })
            .then(expectZeroNewChallenges);
    });

    it('leader can NOT challenge a team who has an outgoing challenge', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(4) })
            .set('Authorization', `JWT ${rank6LeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('cannot have more than 1 outgoing challenges');
            })
            .then(expectZeroNewChallenges);
    });

    it('partner can NOT challenge a team who has an outgoing challenge', function() {
        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: TestUtils.getTeamByRank(4) })
            .set('Authorization', `JWT ${rank6PartnerToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('cannot have more than 1 outgoing challenges');
            })
            .then(expectZeroNewChallenges);
    });

    //
    // it('can NOT challenge when already having an outgoing challenge', function() {
    //     return requester
    //         .post('/api/challenge/team')
    //         .send({ challengeeId: "000000000000000000000002" })
    //         .set('Authorization', `JWT ${rank4Token}`)
    //         .then((res) => {
    //             expect(res).to.have.status(500);
    //             expect(res.body).to.contain('cannot have more than 1 outgoing challenges');
    //         })
    //         .then(expectZeroNewChallenges);
    // });
    //
    // it('can NOT challenge when already having an incoming challenge', function() {
    //     return requester
    //         .post('/api/challenge/team')
    //         .send({ challengeeId: "000000000000000000000002" })
    //         .set('Authorization', `JWT ${rank3Token}`)
    //         .then((res) => {
    //             expect(res).to.have.status(500);
    //             expect(res.body).to.contain('cannot have more than 1 incoming challenges');
    //         })
    //         .then(expectZeroNewChallenges);
    // });

    it('leader can NOT challenge an inactive team', function() {
        const INACTIVE_TEAM = TestUtils.getTeams().find(t => t.active === false);

        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: INACTIVE_TEAM._id })
            .set('Authorization', `JWT ${rank6LeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('must have an active account');
            })
            .then(expectZeroNewChallenges);
    });

    it('partner can NOT challenge an inactive team', function() {
        const INACTIVE_TEAM = TestUtils.getTeams().find(t => t.active === false);

        return requester
            .post('/api/challenge/team')
            .send({ challengeeId: INACTIVE_TEAM._id })
            .set('Authorization', `JWT ${rank6LeaderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.contain('must have an active account');
            })
            .then(expectZeroNewChallenges);
    });

    it('leader can NOT challenge after the team is deactivated', function() {
        return Team.findOneAndUpdate({ _id: "000000000000000000000006" }, { active: false }).exec()
            .then(() => {
                return requester
                    .post('/api/challenge/team')
                    .send({ challengeeId: TestUtils.getTeamByRank(5)._id })
                    .set('Authorization', `JWT ${rank6LeaderToken}`)
                    .then((res) => {
                        expect(res).to.have.status(500);
                        expect(res.body).to.contain('Both teams must have an active accounts');
                    })
                    .then(expectZeroNewChallenges);
            });
    });

    it('partner can NOT challenge after the team is deactivated', function() {
        return Team.findOneAndUpdate({ _id: "000000000000000000000006" }, { active: false }).exec()
            .then(() => {
                return requester
                    .post('/api/challenge/team')
                    .send({ challengeeId: TestUtils.getTeamByRank(5)._id })
                    .set('Authorization', `JWT ${rank6PartnerToken}`)
                    .then((res) => {
                        expect(res).to.have.status(500);
                        expect(res.body).to.contain('Both teams must have an active accounts');
                    })
                    .then(expectZeroNewChallenges);
            });
    });


    it('leader can NOT challenge a deactivated team', function() {
        return Team.findOneAndUpdate({ _id: "000000000000000000000005" }, { active: false }).exec()
            .then(() => {
                return requester
                    .post('/api/challenge/team')
                    .send({ challengeeId: TestUtils.getTeamByRank(5)._id })
                    .set('Authorization', `JWT ${rank6LeaderToken}`)
                    .then((res) => {
                        expect(res).to.have.status(500);
                        expect(res.body).to.contain('Both teams must have an active accounts');
                    })
                    .then(expectZeroNewChallenges);
            });
    });

    it('partner can NOT challenge a deactivated team', function() {
        return Team.findOneAndUpdate({ _id: "000000000000000000000005" }, { active: false }).exec()
            .then(() => {
                return requester
                    .post('/api/challenge/team')
                    .send({ challengeeId: TestUtils.getTeamByRank(5)._id })
                    .set('Authorization', `JWT ${rank6PartnerToken}`)
                    .then((res) => {
                        expect(res).to.have.status(500);
                        expect(res.body).to.contain('Both teams must have an active accounts');
                    })
                    .then(expectZeroNewChallenges);
            });
    });

    describe('required fields', function() {

        it('must provide challengeeId', function() {
            return requester
                .post('/api/challenge/team')
                .send({ challengeeId: undefined })
                .set('Authorization', `JWT ${rank6LeaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Challengee id is required');
                })
                .then(expectZeroNewChallenges);
        });

    });

});

function expectOneNewChallenge() {
    return TeamChallenge.countDocuments().exec()
        .then((challengeCount) => expect(challengeCount, 'challenge count').to.equal(TestUtils.getTeamChallenges().length + 1));
}

function expectZeroNewChallenges() {
    return TeamChallenge.countDocuments().exec()
        .then((challengeCount) => expect(challengeCount, 'challenge count').to.equal(TestUtils.getTeamChallenges().length));
}