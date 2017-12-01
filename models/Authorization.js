var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var uuid = require('uuid');

var authorizationSchema = new Schema({
	user: { type: Schema.ObjectId, ref: 'Player', required: true },
	password: { type: String, required: true },
    reset: {
	    key: { type: String },
        date: { type: Date }
	}
});

authorizationSchema.methods.setPassword = function(password) {
    var self = this;
    var salt = bcrypt.genSaltSync();
    return bcrypt.hash(password, salt)
        .then(function(passwordHash) {
            self.password = passwordHash;
            return self.save();
        });
};

authorizationSchema.methods.isPasswordEqualTo = function(password) {
    var self = this;
    return bcrypt.compareSync(password, self.password);
};

authorizationSchema.methods.enablePasswordReset = function() {
    var self = this;
    self.reset.key = uuid();
    self.reset.date = new Date();
    return self.save();
};

authorizationSchema.methods.getResetKey = function() {
    var self = this;
    return self.reset.key;
};

authorizationSchema.methods.getResetDate = function() {
    var self = this;
    return self.reset.date;
};

authorizationSchema.statics.findByResetKey = function(resetKey) {
    return Authorization.findOne({'reset.key': resetKey}).exec();
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
