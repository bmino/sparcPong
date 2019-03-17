const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let teamSchema = new Schema({
	username: { type: String, required: true, unique: true },
	leader: { type: Schema.ObjectId, ref: 'Player', required: true },
	partner: { type: Schema.ObjectId, ref: 'Player', required: false },
	rank: { type: Number, default: 0 },
	lastGame: { type: Date, default: null },
    active: { type: Boolean, required: true, default: true }
});

teamSchema.methods.hasMemberByPlayerId = function(playerId) {
    console.log(`Checking if player id ${playerId} is on team ${this.username}`);
    if (this.leader.toString() === playerId.toString()) return true;
    if (this.partner.toString() === playerId.toString()) return true;
    return false;
};

teamSchema.statics.getTeamByPlayerId = function(playerId) {
	return Team.findOne({$or: [{leader: playerId}, {partner: playerId}]}).exec();
};

teamSchema.statics.usernameExists = function(username) {
    console.log(`Checking if team username, ${username}, exists.`);
    return new Promise((resolve, reject) => {
        Team.countDocuments({username: username}).exec()
            .then((count) => {
                if (count !== 0) return reject(new Error('Team username already exists'));
                return resolve(username);
            })
            .catch(reject);
    });
};

teamSchema.statics.lowestRank = function() {
    console.log('Finding lowest team rank.');
    return new Promise((resolve, reject) => {
        Team.find().sort({'rank': -1}).limit(1).exec()
            .then((lowestRankTeam) => {
                let lowestRank = 0;
                if (lowestRankTeam && lowestRankTeam.length > 0) {
                    lowestRank = lowestRankTeam[0].rank;
                }
                console.log(`Found lowest rank of ${lowestRank}`);
                return resolve(lowestRank);
            })
            .catch(reject);
    });
};

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
