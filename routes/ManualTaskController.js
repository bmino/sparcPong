var express = require('express');
var router = express.Router();
var ManualTaskService = require('../services/ManualTaskService');


router.get('/challenge', function(req, res, next) {
    if (!req.query.key || req.query.key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');

    ManualTaskService.autoChallenge(req)
        .then(function(issued) {
            var msg = 'Issued ' + issued + ' challenges';
            console.log('[Manual] - ' + msg);
            res.json(msg);
        })
        .catch(next);
});

router.get('/forfeit', function(req, res, next) {
	if (!req.query.key || req.query.key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');

    ManualTaskService.autoForfeit(req)
        .then(function(results) {
        	var msg = 'Forfeited ' + results.length + ' challenges';
        	console.log('[Manual] - ' + msg);
            res.json(msg);
        })
		.catch(next);
});

router.get('/deactivate', function(req, res, next) {
    if (!req.query.key || req.query.key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');
    if (!req.query.id) return res.json('Missing id');

    return ManualTaskService.deactivatePlayer(req.query.id, req)
        .then(function() {
            var msg = 'Deactivated player';
            console.log('[Manual] - ' + msg);
            res.json(msg);
        })
        .catch(next);
});


module.exports = router;
