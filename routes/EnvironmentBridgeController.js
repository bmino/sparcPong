const express = require('express');
const router = express.Router();
const PlayerChallengeService = require('../services/PlayerChallengeService');
const TeamChallengeService = require('../services/TeamChallengeService');


/**
 * ALLOWED_CHALLENGE_DAYS
 */
router.get('/ALLOWED_CHALLENGE_DAYS', (req, res, next) => {
	res.json({ days: PlayerChallengeService.ALLOWED_CHALLENGE_DAYS });
});

/**
 * ALLOWED_CHALLENGE_DAYS_TEAM
 */
router.get('/ALLOWED_CHALLENGE_DAYS_TEAM', (req, res, next) => {
    res.json({ days: TeamChallengeService.ALLOWED_CHALLENGE_DAYS_TEAM });
});

module.exports = router;
