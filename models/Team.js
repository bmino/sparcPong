var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamSchema = new Schema({
	username: { type: String, required: true, unique: true },
	leader: { type: Schema.ObjectId, ref: 'Player', required: true },
	partner: { type: Schema.ObjectId, ref: 'Player', required: false },
	rank: { type: Number, default: 0 },
	lastGame: { type: Date, default: null }
});

var Team = mongoose.model('Team', teamSchema);

module.exports = Team;
