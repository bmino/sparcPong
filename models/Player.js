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

playerSchema.methods.validRealName = function() {
	var self = this;
    console.log('Verifying real name of '+ this.firstName +' '+ this.lastName);

    return new Promise(function(resolve, reject) {
    	
        if (!self.firstName || !self.lastName) return reject(new Error('You must give a first and last name.'));

        // Can only be 15 characters long
        if (self.firstName.length > 15 || self.firstName.length < 1 || self.lastName.length > 15 || self.lastName.length < 1)
            return reject(new Error('First and last name must be between '+ 1 +' and '+ 15 +' characters.'));

        // No special characters
        if (!/^[A-Za-z0-9_ ]*$/.test(self.firstName) || !/^[A-Za-z0-9_ ]*$/.test(self.lastName))
            return reject(new Error('First and last name can only include letters, numbers, underscores, and spaces.'));

        // Concurrent spaces
        if (/\s{2,}/.test(self.firstName) || /\s{2,}/.test(self.lastName))
            return reject(new Error('First and last name cannot have concurrent spaces.'));

        // Concurrent underscores
        if (/_{2,}/.test(self.firstName) || /_{2,}/.test(self.lastName))
            return reject(new Error('First and last name cannot have concurrent underscores.'));

        return resolve(self);
    });
};

playerSchema.methods.validUsername = function() {
    var USERNAME_LENGTH_MIN = process.env.USERNAME_LENGTH_MIN || 2;
    var USERNAME_LENGTH_MAX = process.env.USERNAME_LENGTH_MAX || 15;

    var self = this;
    console.log('Verifying username of '+ self.username);

	return new Promise(function(resolve, reject) {
		if (!self.username) return reject(new Error('You must give a username.'));

		// Can only be 15 characters long
		if (self.username.length > USERNAME_LENGTH_MAX || self.username.length < USERNAME_LENGTH_MIN)
			return reject(new Error('Username length must be between '+ USERNAME_LENGTH_MIN +' and '+ USERNAME_LENGTH_MAX +' characters.'));

		// No special characters
		if (!/^[A-Za-z0-9_ ]*$/.test(self.username)) return reject(new Error('Username can only include letters, numbers, underscores, and spaces.'));

		// Concurrent spaces
		if (/\s{2,}/.test(self.username)) return reject(new Error('Username cannot have concurrent spaces.'));

		// Concurrent underscores
		if (/_{2,}/.test(self.username)) return reject(new Error('Username cannot have concurrent underscores.'));

		return Player.usernameExists(self.username)
			.then(function() {
				return resolve(self);
			})
			.catch(reject);
	});
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
    console.log('Checking if username, ' + username + ', exists.');
    return new Promise(function (resolve, reject) {
        Player.count({username: username}).exec()
			.then(function(count) {
				if (count !== 0) return reject(new Error('Username already exists.'));
				return resolve(count);
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
