const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Util = require('../services/Util');

let teamChallengeSchema = new Schema({
	challenger: { type: Schema.ObjectId, ref: 'Team', required: true },
	challengee: { type: Schema.ObjectId, ref: 'Team', required: true },
	winner: { type: Schema.ObjectId, ref: 'Team', default: null },
	challengerScore: { type: Number, default: null },
	challengeeScore: { type: Number, default: null }
},
{
	timestamps: true
});

teamChallengeSchema.methods.getWinner = function() {
    // If challenge was forfeited
    if (!this.challengerScore && !this.challengeeScore) return this.challenger;
    return this.challengerScore > this.challengeeScore ? this.challenger : this.challengee;
};

teamChallengeSchema.methods.getLoser = function() {
    // If challenge was forfeited
    if (!this.challengerScore && !this.challengeeScore) return this.challengee;
    return this.challengerScore < this.challengeeScore ? this.challenger : this.challengee;
};

teamChallengeSchema.methods.setScore = function(challengerScore, challengeeScore) {
    this.challengerScore = challengerScore;
    this.challengeeScore = challengeeScore;
    this.winner = this.getWinner();
};

teamChallengeSchema.statics.createByTeams = function(teams) {
    let challenge = new TeamChallenge();
    challenge.challenger = teams[0]._id;
    challenge.challengee = teams[1]._id;
    return challenge.save();
};


teamChallengeSchema.statics.getResolvedBetweenTeams = function(teams) {
    return TeamChallenge.find({$or: [
        {$and: [{challenger: teams[0]._id}, {challengee: teams[1]._id}, {winner: {$ne: null}}]},
        {$and: [{challenger: teams[1]._id}, {challengee: teams[0]._id}, {winner: {$ne: null}}]}
    ]}).exec();
};

teamChallengeSchema.statics.getUnresolvedBetweenTeams = function(teams) {
    return TeamChallenge.find(
        {$or: [
            {$and: [{challenger: teams[0]._id}, {challengee: teams[1]._id}, {winner: null}]},
            {$and: [{challenger: teams[1]._id}, {challengee: teams[0]._id}, {winner: null}]}
        ]
        }).exec();
};

teamChallengeSchema.statics.getResolved = function(teamId) {
    return TeamChallenge.find({ $and: [
        {$or: [{'challenger': teamId}, {'challengee': teamId}]},
        {'winner': {$ne: null}}
    ]})
        .exec();
};

teamChallengeSchema.statics.getAllExpired = function() {
    return TeamChallenge.find({winner: null}).populate('challenger challengee').exec()
        .then(function(challenges) {
            return challenges.filter(function(challenge) {
                let expirationDate = Util.addBusinessDays(challenge.createdAt, process.env.ALLOWED_CHALLENGE_DAYS_TEAM || 5);
                return expirationDate < new Date();
            });
        });
};

teamChallengeSchema.statics.getOutgoing = function(teamId) {
    return TeamChallenge.find({challenger: teamId, winner: null}).exec();
};

teamChallengeSchema.statics.getIncoming = function(teamId) {
    return TeamChallenge.find({challengee: teamId, winner: null}).exec();
};

teamChallengeSchema.statics.populateById = function(teamChallengeId, populateAlerts) {
    let population = {
        path: 'challenger challengee',
        populate: {
            path: 'leader partner',
            populate: {
                path: ''
            }
        }
    };
    if (populateAlerts !== undefined) population.populate.populate.path = 'alerts';
    return TeamChallenge.findById(teamChallengeId).populate(population).exec();
};

teamChallengeSchema.statics.populateTeams = function(challenges) {
    return TeamChallenge.populate(challenges, 'challenger challengee');
};

teamChallengeSchema.statics.populateTeamsAndTeamMembers = function(challenges) {
    return TeamChallenge.populate(challenges, {
        path: 'challenger challengee',
        populate: {path: 'leader partner'}
    });
};

teamChallengeSchema.statics.removeByDocument = function(teamChallenge) {
    return teamChallenge.remove();
};

const TeamChallenge = mongoose.model('TeamChallenge', teamChallengeSchema);

module.exports = TeamChallenge;