const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let playerSchema = new Schema({
	username: { type: String, required: true, unique: true },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	alerts: { type: Schema.ObjectId, ref: 'Alert' },
	rank: { type: Number, default: 0 },
	phone: Number,
	email: String,
    active: { type: Boolean, required: true, default: true }
});

playerSchema.methods.attachAlert = function(alert) {
	this.alerts = alert._id;
	return this.save();
};

playerSchema.statics.findByAuthorization = function(authorization) {
    return Player.findById(authorization.user).exec();
};

playerSchema.statics.usernameExists = function(username) {
    console.log(`Checking if player username exists: ${username}`);
    return Player.countDocuments({username: username}).exec()
        .then((count)  => {
            if (count !== 0) return Promise.reject(new Error('Player username already exists'));
            return Promise.resolve(username);
        });
};

playerSchema.statics.emailExists = function(email) {
    console.log(`Checking if email exists: ${email}`);
    return Player.countDocuments({email: email}).exec()
        .then((count)  => {
            if (count !== 0) return Promise.reject(new Error('Email already exists'));
            return Promise.resolve(count);
        });
};

playerSchema.statics.lowestRank = function() {
	console.log('Finding lowest player rank.');
    return Player.find().sort({'rank': -1}).limit(1).exec()
        .then((lowestRankPlayer) => {
            let lowestRank = 0;
            if (lowestRankPlayer && lowestRankPlayer.length > 0) {
                lowestRank = lowestRankPlayer[0].rank;
            }
            console.log(`Found lowest rank of ${lowestRank}`);
            return Promise.resolve(lowestRank);
        });
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
