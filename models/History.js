var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var historySchema = new Schema({
	playerId: { type: ObjectId, required: true },
	opponentId: { type: ObjectId, required: true },
	playerScore: { type: Number, required: true },
	opponentScore: { type: Number, required: true }
	
},
{
	timestamps: true
});

var History = mongoose.model('History', historySchema);

module.exports = History;