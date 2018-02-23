var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Util = require('../services/Util');

var challengeSchema = new Schema({
	challenger: { type: Schema.ObjectId, ref: 'Player', required: true },
	challengee: { type: Schema.ObjectId, ref: 'Player', required: true },
	winner: { type: Schema.ObjectId, ref: 'Player', default: null },
	challengerScore: { type: Number, default: null },
	challengeeScore: { type: Number, default: null }
},
{
	timestamps: true
});

challengeSchema.methods.getWinner = function() {
    // If challenge was forfeited
    if (!this.challengerScore && !this.challengeeScore) return this.challenger;
    return this.challengerScore > this.challengeeScore ? this.challenger : this.challengee;
};

challengeSchema.methods.getLoser = function() {
    // If challenge was forfeited
    if (!this.challengerScore && !this.challengeeScore) return this.challengee;
    return this.challengerScore < this.challengeeScore ? this.challenger : this.challengee;
};

challengeSchema.methods.setScore = function(challengerScore, challengeeScore) {
	this.challengerScore = challengerScore;
	this.challengeeScore = challengeeScore;
	this.winner = this.getWinner();
};

challengeSchema.statics.createByPlayers = function(players) {
    console.log('Creating new challenge between ' + players[0].username + ' and ' + players[1].username);
    var challenge = new Challenge();
    challenge.challenger = players[0]._id;
    challenge.challengee = players[1]._id;
    return challenge.save();
};


challengeSchema.statics.getIncoming = function(playerId) {
    return Challenge.find({challengee: playerId, winner: null}).exec();
};

challengeSchema.statics.getOutgoing = function(playerId) {
    return Challenge.find({challenger: playerId, winner: null}).exec();
};

challengeSchema.statics.getResolved = function(playerId) {
    return Challenge.find({ $and: [
        {$or: [{'challenger': playerId}, {'challengee': playerId}]},
        {'winner': {$ne: null}}
    ]})
        .exec();
};

challengeSchema.statics.getUnresolved = function(playerId) {
    return Challenge.find({ $and: [
        {$or: [{'challenger': playerId}, {'challengee': playerId}]},
        {'winner': null}
    ]})
        .exec();
};

challengeSchema.statics.getResolvedBetweenPlayers = function(players) {
    return Challenge.find({$or: [
        {$and: [{challenger: players[0]._id}, {challengee: players[1]._id}, {winner: {$ne: null}}]},
        {$and: [{challenger: players[1]._id}, {challengee: players[0]._id}, {winner: {$ne: null}}]}
    ]}).exec();
};

challengeSchema.statics.getUnresolvedBetweenPlayers = function(players) {
    return Challenge.find(
        {$or: [
            {$and: [{challenger: players[0]._id}, {challengee: players[1]._id}, {winner: null}]},
            {$and: [{challenger: players[1]._id}, {challengee: players[0]._id}, {winner: null}]}
        ]
        }).exec();
};

challengeSchema.statics.getAllExpired = function() {
    return Challenge.find({winner: null}).exec()
        .then(function(challenges) {
            return challenges.filter(function(challenge) {
                var expirationDate = Util.addBusinessDays(challenge.createdAt, process.env.ALLOWED_CHALLENGE_DAYS || 4);
                return expirationDate < new Date();
            });
        });
};

challengeSchema.statics.populateById = function(challengeId, populateAlerts) {
    var population = {
        path: 'challenger challengee',
        populate: {
            path: ''
        }
    };
    if (populateAlerts !== undefined) population.populate.path = 'alerts';
    return Challenge.findById(challengeId).populate(population).exec();
};

challengeSchema.statics.populatePlayers = function(challenges) {
    return Challenge.populate(challenges, 'challenger challengee');
};

challengeSchema.statics.removeByDocument = function(challenge) {
    return challenge.remove();
};

var Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;