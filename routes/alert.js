var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var Alert = mongoose.model('Alert');

/* Get player alerts */
router.get('/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	if (!playerId)
		return next(new Error('You must provide a valid player id.'));
	Player.findById(playerId).populate('alerts').exec(function(err, player) {
		if (err) return next(err);
		if (!player || !player.alerts) return next(new Error("Could not find the player's alert settings."));
		var needAlerts = {};
		
		/* Add New Alerts Here */
		needAlerts.challenged = player.alerts.challenged;
		needAlerts.revoked = player.alerts.revoked;
		needAlerts.resolved = player.alerts.resolved;
		needAlerts.forfeited = player.alerts.forfeited;
		
		res.json({message: needAlerts});
	});
});

/* POST player alerts */
router.post('/', function(req, res, next) {
	var playerId = req.body.playerId;
	var newAlerts = req.body.alerts;
	if (!playerId)
		return next(new Error('You must provide a valid player id.'));
	if (!newAlerts)
		return next(new Error('Uh oh, the alert preferences got lost along the way.'));
	
	Player.findById(playerId).populate('alerts').exec(function(err, player) {
		if (err) return next(err);
		if (!player || !player.alerts) return (new Error("Could not find the player."));
		
		player.alerts.challenged = newAlerts.challenged;
		player.alerts.revoked = newAlerts.revoked;
		player.alerts.resolved = newAlerts.resolved;
		player.alerts.forfeited = newAlerts.forfeited;
		
		player.alerts.save(function(err) {
			if (err) return next(err);
			res.json({message: 'Alerts updated successfully!'});
		});
	});
});



module.exports = router;
