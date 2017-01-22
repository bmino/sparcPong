var express = require('express');
var router = express.Router();

/* ALLOWED_CHALLENGE_DAYS */
router.get('/ALLOWED_CHALLENGE_DAYS', function(req, res, next) {
	res.json({ days: process.env.ALLOWED_CHALLENGE_DAYS || 4 });
});

router.get('/ALLOWED_CHALLENGE_DAYS_TEAM', function(req, res, next) {
    res.json({ days: process.env.ALLOWED_CHALLENGE_DAYS_TEAM || 5});
});

module.exports = router;
