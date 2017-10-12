var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var alertSchema = new Schema({
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

alertSchema.statics.attachToPlayer = function(player) {
    console.log('Creating player alert settings.');
    var newAlert = new Alert();
    return newAlert.save()
		.then(function(alert) {
			return player.attachAlert(alert);
		});
};

var Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
