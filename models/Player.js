var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
	name: { type: String, required: true, unique: true },
	rank: { type: Number, default: 0 },
	lastGame: { type: Date, default: null },
	phone: Number,
	email: String,
	challengeAlert: { type: Boolean, default: false }
	
});

var Player = mongoose.model('Player', playerSchema);

module.exports = Player;