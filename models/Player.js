var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
	username: { type: String, required: true, unique: true },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	alerts: { type: Schema.ObjectId, ref: 'Alert' },
	rank: { type: Number, default: 0 },
	lastGame: { type: Date, default: null },
	phone: Number,
	email: String
});

playerSchema.methods.attachAlert = function(alert) {
	this.alerts = alert._id;
	return this.save();
};

playerSchema.methods.validEmail = function() {
    var self = this;
	console.log('Verifying email of '+ self.email);

    return new Promise(function(resolve, reject) {
        if (self.email.length === 0) return reject(new Error('Email is too short.'));

        // Needs one @ symbol
        if ((self.email.match(/@/g) || []).length !== 1) return reject(new Error('Email must contain one @ symbol.'));

        // Needs a period
        if ((self.email.match(/\./g) || []).length < 1) return reject(new Error('Email must contain at least one period.'));

        return Player.emailExists(self.email)
            .then(function() {
            	return resolve(self);
			})
            .catch(reject);
    });
};

playerSchema.statics.usernameExists = function(username) {
    console.log('Checking if player username, ' + username + ', exists.');
    return new Promise(function (resolve, reject) {
        Player.count({username: username}).exec()
			.then(function(count) {
				if (count !== 0) return reject(new Error('Player username already exists.'));
				return resolve(username);
			})
			.catch(reject);
    });
};

playerSchema.statics.emailExists = function(email) {
    console.log('Checking if email, '+ email +', exists.');
    return new Promise(function(resolve, reject) {
        Player.count({email: email}).exec()
			.then(function(count) {
				if (count !== 0) return reject(new Error('Email already exists.'));
				return resolve(count);
        });
    });
};

playerSchema.statics.lowestRank = function() {
	console.log('Finding lowest player rank.');
    return new Promise(function(resolve, reject) {
        return Player.find().sort({'rank': -1}).limit(1).exec()
            .then(function (lowestRankPlayer) {
                var lowestRank = 0;
                if (lowestRankPlayer && lowestRankPlayer.length > 0) {
                    lowestRank = lowestRankPlayer[0].rank;
                }
                console.log('Found lowest rank of ' + lowestRank);
                return resolve(lowestRank);
            })
			.catch(reject);
    });
};

var Player = mongoose.model('Player', playerSchema);

module.exports = Player;
