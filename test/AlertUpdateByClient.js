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
const JSON_PAYLOAD = {
    alerts: {
        challenged: true,
        revoked: true,
        resolved: true,
        forfeited: false,

        team: {
            challenged: false,
            revoked: true,
            resolved: true,
            forfeited: false,
        }
    }
};

describe('update alerts', function() {

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
            .post('/api/alerts')
            .send(JSON_PAYLOAD)
            .then((res) => {
                expect(res).to.have.status(401);
            })
            .then(expectAlertToNotUpdate);
    });

    it('updates alerts successfully', function() {
        return requester
            .post('/api/alerts')
            .send(JSON_PAYLOAD)
            .set('Authorization', `JWT ${rank1Token}`)
            .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.contain.keys('message');
            })
            .then(expectAlertToUpdate);
    });

    it('errors gracefully for an player with no alerts', function() {
        return Alert.findOneAndDelete({_id: TestUtils.getPlayerByRank(1).alerts}).exec()
            .then(() => {
                return requester
                    .post('/api/alerts')
                    .send(JSON_PAYLOAD)
                    .set('Authorization', `JWT ${rank1Token}`)
                    .then((res) => {
                        expect(res).to.have.status(500);
                        expect(res.body).to.equal('Could not find the player\'s alert settings');
                    });
            });
    });

    describe('required fields', function() {

        it('must provide alerts', function() {
            return requester
                .post('/api/alerts')
                .send({ ...JSON_PAYLOAD, alerts: undefined })
                .set('Authorization', `JWT ${rank1Token}`)
                .then((res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.equal('Alerts is required');
                })
                .then(expectAlertToNotUpdate);
        });

    });

});

function expectAlertToNotUpdate() {
    const alertId = TestUtils.getPlayerByRank(1).alerts;
    const originalAlert = TestUtils.getAlertById(alertId);

    return Alert.findById(alertId).exec()
        .then((realAlert) => {
            ALERT_KEYS.forEach(k => expect(realAlert[k], 'real alert').to.equal(originalAlert[k], 'original alert'));
            ALERT_KEYS.forEach(k => expect(realAlert.team[k], 'real team alert').to.equal(originalAlert.team[k], 'original team alert'));
        });
}

function expectAlertToUpdate() {
    const alertId = TestUtils.getPlayerByRank(1).alerts;

    return Alert.findById(alertId).exec()
        .then((realAlert) => {
            ALERT_KEYS.forEach(k => expect(realAlert[k], 'real alert').to.equal(JSON_PAYLOAD.alerts[k], 'alert payload'));
            ALERT_KEYS.forEach(k => expect(realAlert.team[k], 'real team alert').to.equal(JSON_PAYLOAD.alerts.team[k], 'alert team payload'));
        });
}