var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamChallengeSchema = new Schema({
	challenger: { type: Schema.ObjectId, ref: 'Team', required: true },
	challengee: { type: Schema.ObjectId, ref: 'Team', required: true },
	winner: { type: Schema.ObjectId, ref: 'Team', default: null },
	challengerScore: { type: Number, default: null },
	challengeeScore: { type: Number, default: null }
},
{
	timestamps: true
});

var TeamChallenge = mongoose.model('TeamChallenge', teamChallengeSchema);

module.exports = TeamChallenge;