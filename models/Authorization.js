var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var authorizationSchema = new Schema({
	user: { type: Schema.ObjectId, ref: 'Player' },
	password: { type: String, required: true }
});

authorizationSchema.statics.authorizePlayerWithPassword = function(player, password) {
    console.log('Creating player authorization.');
    var authorization = new Authorization();
    authorization.user = player._id;
    authorization.password = password;
    return authorization.save();
};

authorizationSchema.statics.countByPlayerIdAndPassword = function(playerId, password) {
	return Authorization.count({$and: [{user: playerId}, {password: password}]}).exec();
};

authorizationSchema.statics.findByPlayerId = function(playerId) {
    return Authorization.findOne({user: playerId}).exec();
};

var Authorization = mongoose.model('Authorization', authorizationSchema);

module.exports = Authorization;
