var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var challengeSchema = new Schema({
	challenger: { type: Schema.ObjectId, ref: 'Player', required: true },
	challengee: { type: Schema.ObjectId, ref: 'Player', required: true },
	winner: { type: Schema.ObjectId, ref: 'Player', default: null },
	challengerScore: { type: Number, default: null },
	challengeeScore: { type: Number, default: null }
},
{
	timestamps: true
});

var Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;