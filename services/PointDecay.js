var PointDecay = {
    DECAY_RATE: process.env.DECAY_RATE || 5,

    implementPointDecay : implementPointDecay
};
module.exports = PointDecay;

var mongoose = require('mongoose');
var Player = mongoose.model('Player');

function implementPointDecay(){
    console.log('Decaying points at a rate of ' + PointDecay.DECAY_RATE + ' percent.');
    Player.find({}, function(err, players) {
        players.forEach( function(player) {
            var pointsToRemove = Math.ceil(player.points * (PointDecay.DECAY_RATE / 100));
            console.log('Removing ' + pointsToRemove + ' from ' + player.username);
            player.points = player.points - pointsToRemove;
            player.save();
        });
    });
};