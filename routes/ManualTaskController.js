const express = require('express');
const router = express.Router();
const ManualTaskService = require('../services/ManualTaskService');


router.get('/challenge', (req, res, next) => {
    if (!req.query.key || req.query.key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');

    ManualTaskService.autoChallenge()
        .then((issued) => {
            let msg = `Issued ${issued} challenges`;
            console.log(`[Manual] - ${msg}`);
            res.json(msg);
        })
        .catch(next);
});

router.get('/forfeit', (req, res, next) => {
	if (!req.query.key || req.query.key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');

	Promise.all([
        ManualTaskService.autoForfeitSingles(),
        ManualTaskService.autoForfeitDoubles()
    ])
        .then((results) => {
            let singlesResults = results[0];
            let doublesResults = results[1];
        	let msg = `Forfeited ${singlesResults.length} challenges (singles) and ${doublesResults.length} challenges (doubles)`;
        	console.log(`[Manual] - ${msg}`);
            res.json(msg);
        })
		.catch(next);
});

router.get('/deactivate', (req, res, next) => {
    if (!req.query.key || req.query.key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');
    if (!req.query.id) return res.json('Missing id');

    return ManualTaskService.deactivatePlayer(req.query.id)
        .then(() => {
            let msg = 'Deactivated player';
            console.log(`[Manual] - ${msg}`);
            res.json(msg);
        })
        .catch(next);
});

router.get('/activate', (req, res, next) => {
    if (!req.query.key || req.query.key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');
    if (!req.query.id) return res.json('Missing id');

    return ManualTaskService.activatePlayer(req.query.id)
        .then(() => {
            let msg = 'Activated player';
            console.log(`[Manual] - ${msg}`);
            res.json(msg);
        })
        .catch(next);
});


module.exports = router;
