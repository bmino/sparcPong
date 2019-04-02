const mongoose = require('mongoose');
require('../models'); // Register schemas
const Team = mongoose.model('Team');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const NameService = require('../services/NameService');
const TestUtils = require('./TestUtils');

const JSON_TEAM = {
    "username": "Test Team",
    "leaderId": "000000000000000000000001",
    "partnerId": "000000000000000000000002"
};

describe('team sign up', function() {

    let mongoServer, requester, leaderToken, partnerToken, outsiderToken;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => Promise.all([
                TestUtils.createToken(JSON_TEAM.leaderId),
                TestUtils.createToken(JSON_TEAM.partnerId),
                TestUtils.createToken(TestUtils.getTeams()[1].leader)
            ]))
            .then(([leaderTok, partnerTok, outsiderTok]) => {
                leaderToken = leaderTok;
                partnerToken = partnerTok;
                outsiderToken = outsiderTok;
            });
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .post('/api/team')
            .send(JSON_TEAM)
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectZeroNewTeams);
    });

    it('does not successfully as non-involved player', function() {
        return requester
            .post('/api/team')
            .send(JSON_TEAM)
            .set('Authorization', `JWT ${outsiderToken}`)
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('You must be a member of a created team');
            })
            .then(expectZeroNewTeams);
    });

    it('completes successfully as leader', function() {
        return requester
            .post('/api/team')
            .send(JSON_TEAM)
            .set('Authorization', `JWT ${leaderToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectOneNewTeam);
    });

    it('completes successfully as partner', function() {
        return requester
            .post('/api/team')
            .send(JSON_TEAM)
            .set('Authorization', `JWT ${partnerToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectOneNewTeam);
    });

    it('assigns a new rank', function() {
        return requester
            .post('/api/team')
            .send(JSON_TEAM)
            .set('Authorization', `JWT ${leaderToken}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(() => Team.findOne({ username: JSON_TEAM.username }).exec())
            .then((newTeam) => {
                const previousMaxRank = Math.max(...TestUtils.getTeams().map(t => t.rank));
                expect(newTeam.rank, 'player rank').to.equal(previousMaxRank + 1);
            });
    });

    describe('team members', function() {

        const DEACTIVATED_PLAYER_ID = TestUtils.getPlayers().find((player) => player.active === false)._id;
        const PLAYER_ON_TEAM_ID = TestUtils.getTeams()[0].leader;

        it('must have an active leader', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, leaderId: DEACTIVATED_PLAYER_ID })
                .set('Authorization', `JWT ${partnerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Deactivated players cannot join a team');
                })
                .then(expectZeroNewTeams);
        });

        it('must have an active partner', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, partnerId: DEACTIVATED_PLAYER_ID })
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Deactivated players cannot join a team');
                })
                .then(expectZeroNewTeams);
        });

        it('cannot be the same player', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, leaderId: TestUtils.getPlayers()[0]._id, partnerId: TestUtils.getPlayers()[0]._id })
                .set('Authorization', `JWT ${partnerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.contain('Invalid team members');
                })
                .then(expectZeroNewTeams);
        });

        it('leader cannot be on another team', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, leaderId: PLAYER_ON_TEAM_ID })
                .set('Authorization', `JWT ${partnerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.contain('Players may not be a part of more than');
                })
                .then(expectZeroNewTeams);
        });

        it('leader cannot be on another team', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, partnerId: PLAYER_ON_TEAM_ID })
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.contain('Players may not be a part of more than');
                })
                .then(expectZeroNewTeams);
        });

        it('leader must exist', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, leaderId: 'F00000000000000000000000' })
                .set('Authorization', `JWT ${partnerToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.contain('Could not find player');
                })
                .then(expectZeroNewTeams);
        });

        it('partner must exist', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, partnerId: 'F00000000000000000000000' })
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.contain('Could not find player');
                })
                .then(expectZeroNewTeams);
        });

    });

    describe('valid username', function() {

        it('must be unique', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, username: TestUtils.getTeams()[0].username })
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Team username already exists');
                })
                .then(expectZeroNewTeams);
        });

        it('must be a string', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, username: 123456789 })
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Invalid username data type');
                })
                .then(expectZeroNewTeams);
        });

        it('cannot have special characters', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, username: 'I@MSPEC!@L' })
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Username can only include letters, numbers, underscores, and spaces');
                })
                .then(expectZeroNewTeams);
        });

        it('cannot have concurrent spaces', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, username: 'FIRST  SECOND' })
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Username cannot have concurrent spaces');
                })
                .then(expectZeroNewTeams);
        });

        it('cannot have concurrent underscores', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, username: 'FIRST__SECOND' })
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Username cannot have concurrent underscores');
                })
                .then(expectZeroNewTeams);
        });

        it('must be long enough', function() {
            const tooShortUsername = 'x'.repeat(Math.max(NameService.USERNAME_LENGTH_MIN - 1, 0));

            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, username: tooShortUsername})
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.contain('Username length must be between').and.to.contain('characters');
                })
                .then(expectZeroNewTeams);
        });

        it('must be short enough', function() {
            const tooLongUsername = 'x'.repeat(NameService.USERNAME_LENGTH_MAX + 1);

            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, username: tooLongUsername})
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.contain('Username length must be between').and.to.contain('characters');
                })
                .then(expectZeroNewTeams);
        });

    });

    describe('required fields', function() {

        it('must provide username', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, username: undefined })
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Username is required');
                })
                .then(expectZeroNewTeams);
        });

        it('must provide leaderId', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, leaderId: undefined })
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Leader id is required');
                })
                .then(expectZeroNewTeams);
        });

        it('must provide partnerId', function() {
            return requester
                .post('/api/team')
                .send({ ...JSON_TEAM, partnerId: undefined })
                .set('Authorization', `JWT ${leaderToken}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Partner id is required');
                })
                .then(expectZeroNewTeams);
        });

    });

});

function expectOneNewTeam() {
    return Team.countDocuments().exec()
        .then((teamCount) => expect(teamCount, 'team count').to.equal(TestUtils.getTeams().length + 1));
}

function expectZeroNewTeams() {
    return Team.countDocuments().exec()
        .then((teamCount) => expect(teamCount, 'team count').to.equal(TestUtils.getTeams().length));
}