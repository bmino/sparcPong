var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var alertSchema = new Schema({
	challenged: { type: Boolean, default: false },
	revoked: { type: Boolean, default: false },
	resolved: { type: Boolean, default: false },
	forfeited: { type: Boolean, default: false }
});

var Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
