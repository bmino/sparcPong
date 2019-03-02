let express = require('express');
let router = express.Router();
let PlayerChallengeService = require('../services/PlayerChallengeService');
let TeamChallengeService = require('../services/TeamChallengeService');


/**
 * ALLOWED_CHALLENGE_DAYS
 */
router.get('/ALLOWED_CHALLENGE_DAYS', function(req, res, next) {
	res.json({ days: PlayerChallengeService.ALLOWED_CHALLENGE_DAYS });
});

/**
 * ALLOWED_CHALLENGE_DAYS_TEAM
 */
router.get('/ALLOWED_CHALLENGE_DAYS_TEAM', function(req, res, next) {
    res.json({ days: TeamChallengeService.ALLOWED_CHALLENGE_DAYS_TEAM });
});

module.exports = router;
