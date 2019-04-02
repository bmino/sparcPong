const mongoose = require('mongoose');
require('../models'); // Register schemas
const Alert = mongoose.model('Alert');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chaiHttp = require('chai-http');
const chai = require('chai');
const { expect } = chai.use(chaiHttp);

process.env.DISABLE_MONGOOSE_CONNECT = true;
const app = require('../app.js');
const TestUtils = require('./TestUtils');

const ALERT_KEYS = ['challenged', 'revoked', 'resolved', 'challenged', 'forfeited'];

describe('fetch alerts', function() {

    let mongoServer, requester, rank1Token;

    before('setup database', function() {
        mongoServer = new MongoMemoryServer();
        requester = chai.request(app).keepOpen();

        return mongoServer.getConnectionString()
            .then((mongoUri) => mongoose.connect(mongoUri, TestUtils.getMongoOptions()))
            .then(() => TestUtils.createToken(TestUtils.getPlayerByRank(1)._id)).then((token) => rank1Token = token);
    });

    beforeEach('reset database', TestUtils.resetDatabase);

    after(function() {
        return mongoose.disconnect()
            .then(() => requester.close())
            .then(() => mongoServer.stop());
    });

    it('requires authentication', function() {
        return requester
            .get('/api/alerts')
            .then((res) => {
                expect(res).to.have.status(401);
            });
    });

    it('returns an alert object', function() {
        return requester
            .get('/api/alerts')
            .set('Authorization', `JWT ${rank1Token}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
                expect(res.body.message).to.contain.keys(...ALERT_KEYS);
                ALERT_KEYS.forEach(k => expect(res.body.message[k]).to.be.a('Boolean'));
                expect(res.body.message).to.contain.keys('team').which.is.an('Object');
                expect(res.body.message.team).to.contain.keys(...ALERT_KEYS);
                ALERT_KEYS.forEach(k => expect(res.body.message.team[k]).to.be.a('Boolean'));
            });
    });

    it('errors gracefully for an player with no alerts', function() {
        return Alert.findOneAndDelete({_id: TestUtils.getPlayerByRank(1).alerts}).exec()
            .then(() => {
                return requester
                    .get('/api/alerts')
                    .set('Authorization', `JWT ${rank1Token}`)
                    .then((res) => {
                        expect(res).to.have.status(500);
                        expect(res.body).to.equal('Could not find the player\'s alert settings');
                    });
            });
    });

});
