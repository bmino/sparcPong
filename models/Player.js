const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let playerSchema = new Schema({
	username: { type: String, required: true, unique: true },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	alerts: { type: Schema.ObjectId, ref: 'Alert' },
	rank: { type: Number, default: 0 },
	lastGame: { type: Date, default: null },
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
    return new Promise((resolve, reject) => {
        Player.countDocuments({username: username}).exec()
			.then((count)  => {
				if (count !== 0) return reject(new Error('Player username already exists'));
				return resolve(username);
			})
			.catch(reject);
    });
};

playerSchema.statics.emailExists = function(email) {
    console.log(`Checking if email exists: ${email}`);
    return new Promise((resolve, reject)  => {
        Player.countDocuments({email: email}).exec()
			.then((count)  => {
				if (count !== 0) return reject(new Error('Email already exists'));
				return resolve(count);
        });
    });
};

playerSchema.statics.lowestRank = function() {
	console.log('Finding lowest player rank.');
    return new Promise((resolve, reject) => {
        return Player.find().sort({'rank': -1}).limit(1).exec()
            .then((lowestRankPlayer) => {
                let lowestRank = 0;
                if (lowestRankPlayer && lowestRankPlayer.length > 0) {
                    lowestRank = lowestRankPlayer[0].rank;
                }
                console.log(`Found lowest rank of ${lowestRank}`);
                return resolve(lowestRank);
            })
			.catch(reject);
    });
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
