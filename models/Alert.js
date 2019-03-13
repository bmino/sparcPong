const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alertSchema = new Schema({
    challenged: { type: Boolean, default: true },
    revoked: { type: Boolean, default: false },
    resolved: { type: Boolean, default: false },
    forfeited: { type: Boolean, default: true },
    team: {
        challenged: { type: Boolean, default: true },
        revoked: { type: Boolean, default: false },
        resolved: { type: Boolean, default: false },
        forfeited: { type: Boolean, default: true }
    }
});

alertSchema.statics.attachToPlayer = (player) => {
    console.log('Creating player alert settings.');
    let newAlert = new Alert();
    return newAlert.save()
        .then((alert) => player.attachAlert(alert));
};

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
