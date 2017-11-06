var express = require('express');
var router = express.Router();
var ChallengeService = require('../services/ChallengeService');

/* ALLOWED_CHALLENGE_DAYS */
router.get('/ALLOWED_CHALLENGE_DAYS', function(req, res, next) {
	res.json({ days: ChallengeService.ALLOWED_CHALLENGE_DAYS });
});

router.get('/ALLOWED_CHALLENGE_DAYS_TEAM', function(req, res, next) {
    res.json({ days: ChallengeService.ALLOWED_CHALLENGE_DAYS_TEAM });
});

module.exports = router;
