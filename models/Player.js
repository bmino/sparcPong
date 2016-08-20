var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
	name: { type: String, required: true, unique: true },
	alerts: { type: Schema.ObjectId, ref: 'Alert' },
	rank: { type: Number, default: 0 },
	lastGame: { type: Date, default: null },
	phone: Number,
	email: String
});

var Player = mongoose.model('Player', playerSchema);

module.exports = Player;
