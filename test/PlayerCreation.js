const mongoose = require('mongoose');
require('../models'); // Register schemas
const Player = mongoose.model('Player');
const Authorization = mongoose.model('Authorization');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');

const JSON_PLAYER = {
    "username": "test_user",
    "password": "test_password",
    "firstName": "John",
    "lastName": "Doe",
    "phone": 8431234567,
    "email": "john.doe@fake_test_email.net"
};

describe('player sign up', function() {

    let mongoServer, requester;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('completes successfully', function() {
        return requester
            .post('/api/player')
            .send(JSON_PLAYER)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(() => Player.findOne({username: JSON_PLAYER.username}).exec())
            .then((newPlayer) => {
                expect(newPlayer, 'new player').to.exist;
                expect(newPlayer.firstName, 'player first name').to.equal(JSON_PLAYER.firstName);
                expect(newPlayer.lastName, 'player last name').to.equal(JSON_PLAYER.lastName);
                expect(newPlayer.email, 'player email').to.equal(JSON_PLAYER.email);
                expect(newPlayer.phone, 'player phone').to.equal(JSON_PLAYER.phone);
                expect(newPlayer.active, 'player active status').to.be.true;
            });
    });

    it('assigns a new rank', function() {
        return requester
            .post('/api/player')
            .send(JSON_PLAYER)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(() => Player.findOne({ username: JSON_PLAYER.username }).exec())
            .then((newPlayer) => {
                const previousMaxRank = Math.max(...TestUtils.getPlayers().map(p => p.rank));
                expect(newPlayer.rank, 'new player rank').to.equal(previousMaxRank + 1);
            });
    });

    it('creates alerts', function() {
        return requester
            .post('/api/player')
            .send(JSON_PLAYER)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(() => Player.findOne({ username: JSON_PLAYER.username }).populate('alerts').exec())
            .then((newPlayer) => {
                expect(newPlayer.alerts, 'new player alerts').to.be.an('object');
            });
    });

    it('creates a password', function() {
        return requester
            .post('/api/player')
            .send(JSON_PLAYER)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(() => Player.findOne({ username: JSON_PLAYER.username }).populate('alerts').exec())
            .then((newPlayer) => Authorization.findOne({user: newPlayer._id}).exec())
            .then((newAuthorization) => {
                expect(newAuthorization, 'authorization').to.exist;
                expect(newAuthorization.password, 'authorization password').not.to.equal(JSON_PLAYER.password).and.not.to.be.null;
                expect(newAuthorization.reset.key, 'authorization reset key').to.be.null;
                expect(newAuthorization.reset.date, 'authorization reset date').to.be.null;
            })
    });

    it('must have a unique username', function() {
        return requester
            .post('/api/player')
            .send({ ...JSON_PLAYER, username: TestUtils.getPlayers()[0].username })
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Player username already exists');
            })
            .then(expectZeroNewPlayers);
    });

    it('must have a unique email', function() {
        return requester
            .post('/api/player')
            .send({ ...JSON_PLAYER, email: TestUtils.getPlayers()[0].email })
            .then((res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.equal('Email already exists');
            })
            .then(expectZeroNewPlayers);
    });

    describe('required fields', function() {

        it('must provide username', function() {
            return requester
                .post('/api/player')
                .send({ ...JSON_PLAYER, username: undefined })
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Username is required');
                })
                .then(expectZeroNewPlayers);
        });

        it('must provide password', function() {
            return requester
                .post('/api/player')
                .send({ ...JSON_PLAYER, email: undefined })
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Email is required');
                })
                .then(expectZeroNewPlayers);
        });

        it('must provide first name', function() {
            return requester
                .post('/api/player')
                .send({ ...JSON_PLAYER, firstName: undefined })
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('First name is required');
                })
                .then(expectZeroNewPlayers);
        });

        it('must provide last name', function() {
            return requester
                .post('/api/player')
                .send({ ...JSON_PLAYER, lastName: undefined })
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Last name is required');
                })
                .then(expectZeroNewPlayers);
        });

        it('must provide phone', function() {
            return requester
                .post('/api/player')
                .send({ ...JSON_PLAYER, phone: undefined })
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Phone is required');
                })
                .then(expectZeroNewPlayers);
        });

        it('must provide email', function() {
            return requester
                .post('/api/player')
                .send({ ...JSON_PLAYER, email: undefined })
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Email is required');
                })
                .then(expectZeroNewPlayers);
        });
    });

});

function expectZeroNewPlayers() {
    return Player.countDocuments().exec()
        .then((playerCount) => expect(playerCount, 'player count').to.equal(TestUtils.getPlayers().length));
}