var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var challengeSchema = new Schema({
	challenger: { type: ObjectId, required: true },
	challengee: { type: ObjectId, required: true }
},
{
	timestamps: true
});

var Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;