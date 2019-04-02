const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Player = mongoose.model('Player');
const AuthService = require('../services/AuthService');


/**
 * Get alerts
 */
router.get('/', (req, res, next) => {
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!clientId) return next(new Error('Valid client id is required'));

	Player.findById(clientId).populate('alerts').exec()
		.then((player) => {
			if (!player || !player.alerts) return Promise.reject(new Error('Could not find the player\'s alert settings'));

			const alerts = {
                challenged: player.alerts.challenged,
                revoked: player.alerts.revoked,
                resolved: player.alerts.resolved,
                forfeited: player.alerts.forfeited,
                team: player.alerts.team
            };

			res.json({message: alerts});
        })
		.catch(next);
});

/**
 * Update alerts
 * @param: newAlerts
 */
router.post('/', (req, res, next) => {
    const { alerts } = req.body;
    const clientId = AuthService.verifyToken(req.token).playerId;

    if (!clientId) return next(new Error('Valid client id is required'));
	if (!alerts) return next(new Error('Alerts is required'));
	
	Player.findById(clientId).populate('alerts').exec()
		.then((player) => {
            if (!player || !player.alerts) return Promise.reject(new Error('Could not find the player\'s alert settings'));

            player.alerts.challenged = alerts.challenged;
            player.alerts.revoked = alerts.revoked;
            player.alerts.resolved = alerts.resolved;
            player.alerts.forfeited = alerts.forfeited;

            player.alerts.team.challenged = alerts.team.challenged;
            player.alerts.team.revoked = alerts.team.revoked;
            player.alerts.team.resolved = alerts.team.resolved;
            player.alerts.team.forfeited = alerts.team.forfeited;

            return player.alerts.save();
        })
		.then(() => {
			res.json({message: 'Alerts updated successfully!'});
		})
		.catch(next);
});



module.exports = router;
