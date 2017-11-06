var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var AuthService = require('../services/AuthService');


/* Get player alerts */
router.get('/', function(req, res, next) {
    var clientId = AuthService.verifyToken(req.auth[1]).playerId;

	if (!clientId) return next(new Error('You must provide a valid player id.'));

	Player.findById(clientId).populate('alerts').exec()
		.then(function(player) {
			if (!player || !player.alerts) return Promise.reject(new Error("Could not find the player's alert settings."));
			var alerts = {};

            alerts.challenged = player.alerts.challenged;
            alerts.revoked = player.alerts.revoked;
            alerts.resolved = player.alerts.resolved;
            alerts.forfeited = player.alerts.forfeited;

            alerts.team = player.alerts.team;

			res.json({message: alerts});
        })
		.catch(next);
});

/* Update player alerts */
router.post('/', function(req, res, next) {
    var newAlerts = req.body.alerts;
    var clientId = AuthService.verifyToken(req.auth[1]).playerId;

    if (!clientId) return next(new Error('You must provide a valid player id.'));
	if (!newAlerts) return next(new Error('Uh oh, the alert preferences got lost along the way.'));
	
	Player.findById(clientId).populate('alerts').exec()
		.then(function(player) {
            if (!player || !player.alerts) return Promise.reject(new Error("Could not find the player's alert settings."));

            player.alerts.challenged = newAlerts.challenged ;
            player.alerts.revoked = newAlerts.revoked ;
            player.alerts.resolved = newAlerts.resolved ;
            player.alerts.forfeited = newAlerts.forfeited ;

            player.alerts.team.challenged = newAlerts.team.challenged ;
            player.alerts.team.revoked = newAlerts.team.revoked ;
            player.alerts.team.resolved = newAlerts.team.resolved ;
            player.alerts.team.forfeited = newAlerts.team.forfeited ;

            return player.alerts.save();
        })
		.then(function() {
			res.json({message: 'Alerts updated successfully!'});
		})
		.catch(next);
});



module.exports = router;
