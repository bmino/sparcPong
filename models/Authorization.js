var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var authorizationSchema = new Schema({
	user: { type: Schema.ObjectId, ref: 'Player' },
	password: { type: String, required: true }
});

authorizationSchema.methods.setPassword = function(password) {
    var self = this;
    return bcrypt.genSalt()
        .then(function(salt) {
            return bcrypt.hash(password, salt);
        })
        .then(function(passwordHash) {
            self.password = passwordHash;
            return self.save();
        });
};

authorizationSchema.methods.isPasswordEqualTo = function(password) {
    var self = this;
    return bcrypt.compareSync(password, self.password);
};

authorizationSchema.statics.attachToPlayerWithPassword = function(player, password) {
    var authorization = new Authorization();
    authorization.user = player._id;
    return authorization.setPassword(password);
};

authorizationSchema.statics.findByPlayerId = function(playerId) {
	return Authorization.findOne({user: playerId}).exec();
};

authorizationSchema.statics.findByPlayerId = function(playerId) {
    return Authorization.findOne({user: playerId}).exec();
};

var Authorization = mongoose.model('Authorization', authorizationSchema);

module.exports = Authorization;
